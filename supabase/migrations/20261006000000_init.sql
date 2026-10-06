-- Biblioteca Educativa: profiles + per-user synced state.
-- Apply in the Supabase dashboard (SQL Editor) or with `supabase db push`.

-- ---------- Profiles (one row per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'Estudiante',
  avatar_color text not null default '#4F806D',
  avatar_url text,
  -- Until Stripe is wired, the plan is set from the client (simulated checkout).
  -- When payments go live, revoke update on this column and set it from a webhook.
  plan text not null default 'free' check (plan in ('free', 'monthly', 'annual')),
  provider text not null default 'email' check (provider in ('email', 'google')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Create the profile automatically when someone signs up (email or Google).
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
begin
  insert into public.profiles (id, first_name, last_name, avatar_url, avatar_color, provider)
  values (
    new.id,
    coalesce(nullif(meta ->> 'first_name', ''), split_part(full_name, ' ', 1), ''),
    coalesce(nullif(meta ->> 'last_name', ''), nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''), ''),
    meta ->> 'avatar_url',
    colors[1 + floor(random() * array_length(colors, 1))::int],
    case when coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google' then 'google' else 'email' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Per-user app state (favorites, progress, tasks, practice, audio...) ----------
-- Stored as JSON documents keyed by name, mirroring the app's local storage keys.
create table if not exists public.user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

drop policy if exists "user_state: own rows" on public.user_state;
create policy "user_state: own rows" on public.user_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_state to authenticated;
