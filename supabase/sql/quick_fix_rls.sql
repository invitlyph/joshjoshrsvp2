-- Quick Fix: Add RLS policies for authenticated users
-- Run this in your Supabase SQL Editor to fix the "new row violates row-level security policy" error

-- ========================
-- Guests - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to create guest accounts" on public.guests;
create policy "Allow authenticated to create guest accounts"
  on public.guests for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Allow authenticated to read all guests" on public.guests;
create policy "Allow authenticated to read all guests"
  on public.guests for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to update their own profile" on public.guests;
create policy "Allow authenticated to update their own profile"
  on public.guests for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ========================
-- Posts - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to create posts" on public.posts;
create policy "Allow authenticated to create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read all posts" on public.posts;
create policy "Allow authenticated to read all posts"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to delete their own posts" on public.posts;
create policy "Allow authenticated to delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = guest_id);

-- ========================
-- Stories - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to create stories" on public.stories;
create policy "Allow authenticated to create stories"
  on public.stories for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read active stories" on public.stories;
create policy "Allow authenticated to read active stories"
  on public.stories for select
  to authenticated
  using (expires_at > now());

drop policy if exists "Allow authenticated to delete their own stories" on public.stories;
create policy "Allow authenticated to delete their own stories"
  on public.stories for delete
  to authenticated
  using (auth.uid() = guest_id);

-- ========================
-- Reactions - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to add reactions" on public.reactions;
create policy "Allow authenticated to add reactions"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read reactions" on public.reactions;
create policy "Allow authenticated to read reactions"
  on public.reactions for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to remove reactions" on public.reactions;
create policy "Allow authenticated to remove reactions"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = guest_id);

-- ========================
-- Comments - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to create comments" on public.comments;
create policy "Allow authenticated to create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read comments" on public.comments;
create policy "Allow authenticated to read comments"
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to delete their own comments" on public.comments;
create policy "Allow authenticated to delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = guest_id);

-- ========================
-- Story Views - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to record story views" on public.story_views;
create policy "Allow authenticated to record story views"
  on public.story_views for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read story views" on public.story_views;
create policy "Allow authenticated to read story views"
  on public.story_views for select
  to authenticated
  using (true);

-- ========================
-- Story Reactions - Add authenticated policies
-- ========================
drop policy if exists "Allow authenticated to add story reactions" on public.story_reactions;
create policy "Allow authenticated to add story reactions"
  on public.story_reactions for insert
  to authenticated
  with check (auth.uid() = guest_id);

drop policy if exists "Allow authenticated to read story reactions" on public.story_reactions;
create policy "Allow authenticated to read story reactions"
  on public.story_reactions for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated to remove story reactions" on public.story_reactions;
create policy "Allow authenticated to remove story reactions"
  on public.story_reactions for delete
  to authenticated
  using (auth.uid() = guest_id);

-- ========================
-- Grants for authenticated role
-- ========================
grant usage on schema public to authenticated;
grant all on public.guests to authenticated;
grant all on public.posts to authenticated;
grant all on public.stories to authenticated;
grant all on public.reactions to authenticated;
grant all on public.comments to authenticated;
grant all on public.story_views to authenticated;
grant all on public.story_reactions to authenticated;

-- ========================
-- Storage policies for authenticated
-- ========================
drop policy if exists "Allow authenticated upload wedding media" on storage.objects;
create policy "Allow authenticated upload wedding media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wedding-media');

drop policy if exists "Allow authenticated delete wedding media" on storage.objects;
create policy "Allow authenticated delete wedding media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'wedding-media');
