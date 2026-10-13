-- Biblioteca Educativa: rol de profesor, cursos, tareas, entregas y material.
-- Aplicar después de 20261006000000_init.sql (SQL Editor del panel o `supabase db push`). Es idempotente.

-- ---------- Perfiles: rol y datos del profesor ----------
alter table public.profiles add column if not exists school text not null default '';   -- establecimiento (solo profesores)
alter table public.profiles add column if not exists subject text not null default '';  -- asignatura que dicta (solo profesores)

update public.profiles set role = 'Estudiante' where role is null or role not in ('Estudiante', 'Profesor');
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('Estudiante', 'Profesor'));
alter table public.profiles drop constraint if exists profiles_school_check;
alter table public.profiles add constraint profiles_school_check check (length(school) <= 120);
alter table public.profiles drop constraint if exists profiles_subject_check;
alter table public.profiles add constraint profiles_subject_check check (length(subject) <= 80);

-- Cuentas creadas como profesor antes de esta migración (el trigger anterior ignoraba el rol).
update public.profiles p
set role = 'Profesor',
    school = left(trim(coalesce(u.raw_user_meta_data ->> 'school', '')), 120),
    subject = left(trim(coalesce(u.raw_user_meta_data ->> 'subject', '')), 80)
from auth.users u
where u.id = p.id and u.raw_user_meta_data ->> 'role' = 'Profesor' and p.role <> 'Profesor';

-- El perfil se crea con los datos que el formulario de registro envía como metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := trim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
  colors text[] := array['#4F806D', '#285B4A', '#9C6450', '#3F5560', '#6B7448', '#C18A45'];
  teacher boolean := meta ->> 'role' = 'Profesor';
begin
  insert into public.profiles (id, first_name, last_name, avatar_url, avatar_color, provider, role, school, subject)
  values (
    new.id,
    coalesce(nullif(meta ->> 'first_name', ''), split_part(full_name, ' ', 1), ''),
    coalesce(nullif(meta ->> 'last_name', ''), nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''), ''),
    meta ->> 'avatar_url',
    colors[1 + floor(random() * array_length(colors, 1))::int],
    case when coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google' then 'google' else 'email' end,
    case when teacher then 'Profesor' else 'Estudiante' end,
    case when teacher then left(trim(coalesce(meta ->> 'school', '')), 120) else '' end,
    case when teacher then left(trim(coalesce(meta ->> 'subject', '')), 80) else '' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- Tablas ----------
-- Código para unirse: 6 caracteres sin 0/O ni 1/I/L, fáciles de dictar en clase.
create or replace function public.new_join_code()
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),    -- p. ej. «4° medio A»
  subject text not null check (length(trim(subject)) between 1 and 80), -- p. ej. «Lengua y Literatura»
  join_code text not null unique default public.new_join_code(),
  created_at timestamptz not null default now()
);

create table if not exists public.course_members (
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  instructions text not null default '' check (length(instructions) <= 5000),
  book_id text,                 -- libro de la biblioteca (opcional)
  practice_set_id text,         -- práctica de la biblioteca (opcional)
  due_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  answer text not null check (length(trim(answer)) between 1 and 20000),
  submitted_at timestamptz not null default now(),
  grade numeric(2, 1) check (grade between 1.0 and 7.0),   -- escala chilena
  feedback text check (length(feedback) <= 2000),
  reviewed_at timestamptz,
  primary key (assignment_id, student_id)
);

-- Material del curso: un archivo del bucket «materials» o un enlace. Puede ir adjunto a una tarea.
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 2000),
  file_path text unique,                                   -- <course_id>/<uuid>-<nombre>
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes between 1 and 26214400),
  url text check (url ~* '^https?://'),
  created_at timestamptz not null default now(),
  constraint materials_file_or_link check ((file_path is null) <> (url is null))
);

create index if not exists courses_teacher_idx on public.courses (teacher_id);
create index if not exists course_members_student_idx on public.course_members (student_id);
create index if not exists assignments_course_idx on public.assignments (course_id);
create index if not exists submissions_student_idx on public.submissions (student_id);
create index if not exists materials_course_idx on public.materials (course_id);
create index if not exists materials_assignment_idx on public.materials (assignment_id);

-- ---------- Funciones auxiliares (security definer para evitar recursión en RLS) ----------
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Profesor');
$$;

create or replace function public.teaches_course(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses where id = c and teacher_id = auth.uid());
$$;

create or replace function public.member_of_course(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_members where course_id = c and student_id = auth.uid());
$$;

-- Curso dueño de un objeto de Storage («<course_id>/…»); null si la ruta no empieza con un uuid.
create or replace function public.course_of_object(object_name text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

-- Cursos del estudiante, con el nombre del profesor (el estudiante no puede leer perfiles ajenos).
drop function if exists public.join_course(text);
drop function if exists public.my_courses();
create or replace function public.my_courses()
returns table (id uuid, teacher_id uuid, teacher_name text, name text, subject text, join_code text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.teacher_id, trim(p.first_name || ' ' || p.last_name), c.name, c.subject, c.join_code, c.created_at
  from public.courses c
  join public.course_members m on m.course_id = c.id and m.student_id = auth.uid()
  left join public.profiles p on p.id = c.teacher_id
  order by c.created_at;
$$;

-- Un estudiante se une con el código (no puede leer cursos ajenos para buscarlo).
create or replace function public.join_course(code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  c public.courses;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if public.is_teacher() then raise exception 'teachers cannot join courses'; end if;
  select * into c from public.courses where join_code = upper(trim(code));
  if not found then raise exception 'course not found'; end if;
  insert into public.course_members (course_id, student_id) values (c.id, auth.uid()) on conflict do nothing;
  return c.id;
end;
$$;

-- Lista del curso para su profesor: solo nombre y color, nunca el resto del perfil.
create or replace function public.course_roster(c uuid)
returns table (student_id uuid, first_name text, last_name text, avatar_color text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.student_id, p.first_name, p.last_name, p.avatar_color, m.joined_at
  from public.course_members m
  left join public.profiles p on p.id = m.student_id
  where m.course_id = c and public.teaches_course(c);
$$;

revoke execute on function public.my_courses(), public.join_course(text), public.course_roster(uuid) from public, anon;
grant execute on function public.my_courses(), public.join_course(text), public.course_roster(uuid) to authenticated;

-- Entregas: la fecha la pone el servidor; el profesor no puede tocar la respuesta y el estudiante no puede tocar la nota.
create or replace function public.submissions_guard()
returns trigger language plpgsql set search_path = '' as $$
declare
  teacher boolean;
begin
  select public.teaches_course(a.course_id) into teacher from public.assignments a where a.id = new.assignment_id;
  if tg_op = 'INSERT' then
    new.submitted_at := now();
    new.grade := null;
    new.feedback := null;
    new.reviewed_at := null;
  elsif coalesce(teacher, false) then
    new.assignment_id := old.assignment_id;
    new.student_id := old.student_id;
    new.answer := old.answer;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := case when new.grade is null then null else now() end;
  else
    new.assignment_id := old.assignment_id;
    new.student_id := old.student_id;
    new.submitted_at := now();
    new.grade := old.grade;
    new.feedback := old.feedback;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_guard on public.submissions;
create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- ---------- RLS ----------
alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.materials enable row level security;

drop policy if exists "courses: teacher manages own" on public.courses;
drop policy if exists "courses: teacher reads own" on public.courses;
drop policy if exists "courses: teacher creates" on public.courses;
drop policy if exists "courses: teacher updates own" on public.courses;
drop policy if exists "courses: teacher deletes own" on public.courses;
drop policy if exists "courses: members read" on public.courses;
create policy "courses: teacher reads own" on public.courses for select to authenticated
  using (teacher_id = (select auth.uid()));
create policy "courses: teacher creates" on public.courses for insert to authenticated
  with check (teacher_id = (select auth.uid()) and public.is_teacher());
create policy "courses: teacher updates own" on public.courses for update to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
create policy "courses: teacher deletes own" on public.courses for delete to authenticated
  using (teacher_id = (select auth.uid()));
create policy "courses: members read" on public.courses for select to authenticated
  using (public.member_of_course(id));

-- Los estudiantes entran solo con join_course(); el profesor ve y quita miembros, pero no agrega a nadie.
drop policy if exists "members: student reads own" on public.course_members;
drop policy if exists "members: student leaves" on public.course_members;
drop policy if exists "members: teacher manages" on public.course_members;
drop policy if exists "members: teacher reads" on public.course_members;
drop policy if exists "members: teacher removes" on public.course_members;
create policy "members: student reads own" on public.course_members for select to authenticated
  using (student_id = (select auth.uid()));
create policy "members: student leaves" on public.course_members for delete to authenticated
  using (student_id = (select auth.uid()));
create policy "members: teacher reads" on public.course_members for select to authenticated
  using (public.teaches_course(course_id));
create policy "members: teacher removes" on public.course_members for delete to authenticated
  using (public.teaches_course(course_id));

drop policy if exists "assignments: teacher manages" on public.assignments;
drop policy if exists "assignments: members read" on public.assignments;
create policy "assignments: teacher manages" on public.assignments for all to authenticated
  using (public.teaches_course(course_id))
  with check (public.teaches_course(course_id));
create policy "assignments: members read" on public.assignments for select to authenticated
  using (public.member_of_course(course_id));

drop policy if exists "submissions: student reads own" on public.submissions;
drop policy if exists "submissions: student submits" on public.submissions;
drop policy if exists "submissions: student edits before review" on public.submissions;
drop policy if exists "submissions: teacher reviews" on public.submissions;
drop policy if exists "submissions: teacher reads" on public.submissions;
drop policy if exists "submissions: teacher grades" on public.submissions;
create policy "submissions: student reads own" on public.submissions for select to authenticated
  using (student_id = (select auth.uid()));
create policy "submissions: student submits" on public.submissions for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (select 1 from public.assignments a where a.id = assignment_id and public.member_of_course(a.course_id))
  );
create policy "submissions: student edits before review" on public.submissions for update to authenticated
  using (student_id = (select auth.uid()) and reviewed_at is null)
  with check (student_id = (select auth.uid()));
create policy "submissions: teacher reads" on public.submissions for select to authenticated
  using (exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_course(a.course_id)));
create policy "submissions: teacher grades" on public.submissions for update to authenticated
  using (exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_course(a.course_id)))
  with check (exists (select 1 from public.assignments a where a.id = assignment_id and public.teaches_course(a.course_id)));

drop policy if exists "materials: teacher manages" on public.materials;
drop policy if exists "materials: members read" on public.materials;
create policy "materials: teacher manages" on public.materials for all to authenticated
  using (public.teaches_course(course_id))
  with check (
    public.teaches_course(course_id)
    and (file_path is null or public.course_of_object(file_path) = course_id)
    and (assignment_id is null or exists (select 1 from public.assignments a where a.id = assignment_id and a.course_id = materials.course_id))
  );
create policy "materials: members read" on public.materials for select to authenticated
  using (public.member_of_course(course_id));

-- La versión anterior de este script exponía perfiles completos entre compañeros; ahora se usan las funciones de arriba.
drop policy if exists "profiles: classmates read" on public.profiles;

grant select, insert, update, delete on public.courses, public.course_members, public.assignments, public.submissions, public.materials to authenticated;

-- ---------- Storage: archivos del material (bucket privado, 25 MB por archivo) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials', 'materials', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet',
    'text/plain',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/mp4', 'audio/wav',
    'video/mp4'
  ]
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "materials storage: teacher uploads" on storage.objects;
drop policy if exists "materials storage: teacher deletes" on storage.objects;
drop policy if exists "materials storage: course reads" on storage.objects;
create policy "materials storage: teacher uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and public.teaches_course(public.course_of_object(name)));
create policy "materials storage: teacher deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and public.teaches_course(public.course_of_object(name)));
create policy "materials storage: course reads" on storage.objects for select to authenticated
  using (
    bucket_id = 'materials'
    and (public.teaches_course(public.course_of_object(name)) or public.member_of_course(public.course_of_object(name)))
  );
