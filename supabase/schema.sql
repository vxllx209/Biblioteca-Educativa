-- ============================================================
-- Biblioteca Educativa — esquema de Supabase
-- Pega y ejecuta este script completo en:
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Bucket de Storage para los PDFs (público para poder mostrarlos
--    en el visor sin necesidad de firmar URLs)
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do nothing;

-- 2) Tabla de metadata de los PDFs subidos
create table if not exists public.pdfs (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('matematicas','lenguaje','historia','ciencias','ingles')),
  title text not null,
  file_path text not null,
  uploaded_by uuid references auth.users(id) default auth.uid(),
  uploader_name text,
  created_at timestamptz not null default now()
);

alter table public.pdfs enable row level security;

drop policy if exists "pdfs_select_authenticated" on public.pdfs;
create policy "pdfs_select_authenticated"
  on public.pdfs for select
  to authenticated
  using (true);

drop policy if exists "pdfs_insert_own" on public.pdfs;
create policy "pdfs_insert_own"
  on public.pdfs for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

drop policy if exists "pdfs_delete_own" on public.pdfs;
create policy "pdfs_delete_own"
  on public.pdfs for delete
  to authenticated
  using (auth.uid() = uploaded_by);

-- 3) Políticas de Storage para el bucket "pdfs"
drop policy if exists "pdfs_storage_read_public" on storage.objects;
create policy "pdfs_storage_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'pdfs');

drop policy if exists "pdfs_storage_insert_authenticated" on storage.objects;
create policy "pdfs_storage_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pdfs');

drop policy if exists "pdfs_storage_delete_own" on storage.objects;
create policy "pdfs_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pdfs' and owner = auth.uid());

-- 4) Limpieza: tabla de una prueba anterior que quedó expuesta
--    sin RLS (aviso de seguridad del Linter de Supabase)
drop table if exists public.inscripciones;

-- ============================================================
-- Nota: por defecto Supabase pide confirmar el correo al
-- registrarse. Para pruebas rápidas con datos imaginarios puedes
-- desactivarlo en: Authentication → Providers → Email →
-- "Confirm email" (apágalo). Así el login funciona apenas alguien
-- se registra, sin revisar bandeja de entrada.
-- ============================================================
