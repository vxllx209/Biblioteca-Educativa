-- Tutor IA: daily usage cap per user, enforced in the database so the client can't raise it.
-- Apply after the init and classroom migrations.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  uses int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Users can see their own usage; writes only happen through consume_ai_credit().
drop policy if exists "ai_usage: read own" on public.ai_usage;
create policy "ai_usage: read own" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Uses one AI correction. Returns the corrections left today, or -1 when the cap is reached.
-- Free plan: 15 per day; Premium plans: 100 per day.
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

  select case when p.plan = 'free' then 15 else 100 end into daily_limit
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

revoke all on function public.consume_ai_credit() from public, anon;
grant execute on function public.consume_ai_credit() to authenticated;
