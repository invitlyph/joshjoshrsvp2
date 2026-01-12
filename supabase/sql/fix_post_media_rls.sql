-- Fix RLS for post_media table
-- Run this in your Supabase SQL Editor

-- Enable RLS on post_media
alter table public.post_media enable row level security;

-- Anon policies
drop policy if exists "Allow anon to insert post_media" on public.post_media;
create policy "Allow anon to insert post_media"
  on public.post_media for insert
  to anon
  with check (true);

drop policy if exists "Allow anon to read post_media" on public.post_media;
create policy "Allow anon to read post_media"
  on public.post_media for select
  to anon
  using (true);

drop policy if exists "Allow anon to delete post_media" on public.post_media;
create policy "Allow anon to delete post_media"
  on public.post_media for delete
  to anon
  using (true);

-- Authenticated policies
drop policy if exists "Allow authenticated to insert post_media" on public.post_media;
create policy "Allow authenticated to insert post_media"
  on public.post_media for insert
  to authenticated
  with check (true);

drop policy if exists "Allow authenticated to read post_media" on public.post_media;
create policy "Allow authenticated to read post_media"
  on public.post_media for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to delete post_media" on public.post_media;
create policy "Allow authenticated to delete post_media"
  on public.post_media for delete
  to authenticated
  using (true);

-- Grants
grant all on public.post_media to anon;
grant all on public.post_media to authenticated;
