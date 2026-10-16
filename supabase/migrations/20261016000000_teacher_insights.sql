-- Panel del profesor: lets a teacher read the study progress of the students in their courses.
-- Apply after 20261015000000_ai_tutor.sql.

-- True when the signed-in user teaches a course the student belongs to.
-- Security definer to avoid RLS recursion between user_state, course_members and courses.
create or replace function public.teaches_student(s uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.course_members m
    join public.courses c on c.id = m.course_id
    where m.student_id = s and c.teacher_id = auth.uid()
  );
$$;

revoke all on function public.teaches_student(uuid) from public, anon;
grant execute on function public.teaches_student(uuid) to authenticated;

-- Only the study keys: reading progress, practice results, PAES answers and activity.
-- Favorites, notifications, personal tasks and audio stay private.
drop policy if exists "user_state: teacher reads students' progress" on public.user_state;
create policy "user_state: teacher reads students' progress" on public.user_state
  for select to authenticated
  using (key in ('progress.v2', 'practice.v1', 'paes.v1', 'activity.v1') and public.teaches_student(user_id));

-- Teachers grade with the AI tutor's help, so they get a larger daily cap.
create or replace function public.consume_ai_credit()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  daily_limit int;
  used int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select case when p.role = 'Profesor' then 200 when p.plan = 'free' then 15 else 100 end into daily_limit
  from public.profiles p where p.id = uid;
  daily_limit := coalesce(daily_limit, 15);

  insert into public.ai_usage as u (user_id, day, uses)
  values (uid, current_date, 1)
  on conflict (user_id, day) do update set uses = u.uses + 1
    where u.uses < daily_limit
  returning u.uses into used;

  if used is null then
    return -1;
  end if;
  return daily_limit - used;
end;
$$;
