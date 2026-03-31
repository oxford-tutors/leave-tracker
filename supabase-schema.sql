-- ============================================================
-- Oxford & Cambridge Tutors — Leave Tracker Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  role        text not null default 'employee' check (role in ('employee','admin')),
  department  text not null default 'General',
  active      boolean not null default true,
  created_at  timestamptz default now()
);

-- Entitlements per user per year
create table public.entitlements (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  year          int not null,
  total_days    numeric not null default 28,
  bank_holidays numeric not null default 8,
  carried_over  numeric not null default 0,
  unique(user_id, year)
);

-- Leave requests
create table public.leave_requests (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  leave_type    text not null,
  start_date    date not null,
  end_date      date not null,
  hours         numeric not null,
  note          text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  responded_at  timestamptz,
  responded_by  uuid references public.profiles(id),
  created_at    timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.entitlements   enable row level security;
alter table public.leave_requests enable row level security;

-- Profiles: users see all profiles (for team view), edit only their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Entitlements: users see their own, admins see all
create policy "entitlements_own" on public.entitlements for select
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Leave requests: users see their own, admins see all
create policy "requests_own" on public.leave_requests for select
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
create policy "requests_insert" on public.leave_requests for insert
  with check (user_id = auth.uid());
create policy "requests_update_own" on public.leave_requests for update
  using (user_id = auth.uid() and status = 'pending');

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    coalesce(new.raw_user_meta_data->>'department', 'General')
  );
  -- Create entitlement for current year
  insert into public.entitlements (user_id, year, total_days, bank_holidays, carried_over)
  values (new.id, extract(year from now())::int, 28, 8, 0);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
