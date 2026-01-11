-- Fix RLS policies for plans table to allow admin management

-- Drop existing policy if exists
drop policy if exists "Anyone can view active plans" on public.plans;

-- Recreate policy for viewing active plans (all users)
create policy "Anyone can view active plans"
  on public.plans
  for select
  using (is_active = true);

-- Add policy for admins to view all plans (including inactive)
create policy "Admins can view all plans"
  on public.plans
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to update plans
create policy "Admins can update plans"
  on public.plans
  for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to insert plans
create policy "Admins can insert plans"
  on public.plans
  for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to delete plans
create policy "Admins can delete plans"
  on public.plans
  for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );
