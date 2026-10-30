-- RouteWise AI – Supabase Schema
-- Run this in the Supabase SQL Editor

-- Saved routes table
create table if not exists public.saved_routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  route_data jsonb not null
);

-- Enable Row Level Security
alter table public.saved_routes enable row level security;

-- Policy: Users can only see their own routes
create policy "Users can view own routes"
  on public.saved_routes for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own routes
create policy "Users can insert own routes"
  on public.saved_routes for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own routes
create policy "Users can delete own routes"
  on public.saved_routes for delete
  using (auth.uid() = user_id);

-- Index for fast user route lookups
create index if not exists saved_routes_user_id_idx
  on public.saved_routes (user_id);

