-- Run this in Supabase SQL Editor
-- Adds blocked_days table for admin-controlled blackout dates

CREATE TABLE public.blocked_days (
  id          uuid default gen_random_uuid() primary key,
  date        date not null unique,
  reason      text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

ALTER TABLE public.blocked_days ENABLE ROW LEVEL SECURITY;

-- Everyone can read blocked days (so calendar shows them)
CREATE POLICY "blocked_days_select" ON public.blocked_days
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "blocked_days_insert" ON public.blocked_days
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "blocked_days_delete" ON public.blocked_days
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
