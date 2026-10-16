-- Stripe payments: the plan is only changed by the server (Edge Functions with the service role).
-- Apply after 20261016000000_teacher_insights.sql.

alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;

-- Users can still edit their own profile, but no longer the plan or the Stripe ids.
revoke update on public.profiles from authenticated, anon;
grant update (first_name, last_name, role, avatar_color, avatar_url, school, subject) on public.profiles to authenticated;

-- One row per completed checkout: the receipt shown on the thank-you page.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'annual')),
  amount int not null,
  currency text not null,
  stripe_session_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments: read own" on public.payments;
create policy "payments: read own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);
