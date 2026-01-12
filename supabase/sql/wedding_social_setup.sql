-- ============================================
-- Wedding Social Schema & Policies
-- Safe to re-run; each policy is dropped before
-- being recreated with the correct definition.
-- ============================================

-- ========================
-- Extensions (if needed)
-- ========================
create extension if not exists "uuid-ossp";

-- ========================
-- Guests
-- ========================
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text,
  avatar_url text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.guests enable row level security;

-- Anon policies (for unauthenticated access)
drop policy if exists "Allow public to create guest accounts" on public.guests;
create policy "Allow public to create guest accounts"
  on public.guests for insert
  to anon
  with check (true);

drop policy if exists "Allow guests to read all guests" on public.guests;
create policy "Allow guests to read all guests"
  on public.guests for select
  to anon
  using (true);

drop policy if exists "Allow guests to update their own profile" on public.guests;
create policy "Allow guests to update their own profile"
  on public.guests for update
  to anon
  using (true)
  with check (true);

-- Authenticated policies (for logged-in users)
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
-- Posts
-- ========================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  caption text,
  location text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

-- Anon policies
drop policy if exists "Allow guests to create posts" on public.posts;
create policy "Allow guests to create posts"
  on public.posts for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read all posts" on public.posts;
create policy "Allow public to read all posts"
  on public.posts for select
  to anon
  using (true);

drop policy if exists "Allow guests to delete their own posts" on public.posts;
create policy "Allow guests to delete their own posts"
  on public.posts for delete
  to anon
  using (true);

-- Authenticated policies
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
-- Stories
-- ========================
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

alter table public.stories enable row level security;

-- Anon policies
drop policy if exists "Allow guests to create stories" on public.stories;
create policy "Allow guests to create stories"
  on public.stories for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read active stories" on public.stories;
create policy "Allow public to read active stories"
  on public.stories for select
  to anon
  using (expires_at > now());

drop policy if exists "Allow guests to delete their own stories" on public.stories;
create policy "Allow guests to delete their own stories"
  on public.stories for delete
  to anon
  using (true);

-- Authenticated policies
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
-- Reactions
-- ========================
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  reaction_type text not null default 'love' check (reaction_type in ('love','celebrate','laugh','wow','pray')),
  created_at timestamptz default now(),
  unique(post_id, guest_id)
);

alter table public.reactions enable row level security;

-- Anon policies
drop policy if exists "Allow guests to add reactions" on public.reactions;
create policy "Allow guests to add reactions"
  on public.reactions for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read reactions" on public.reactions;
create policy "Allow public to read reactions"
  on public.reactions for select
  to anon
  using (true);

drop policy if exists "Allow guests to remove reactions" on public.reactions;
create policy "Allow guests to remove reactions"
  on public.reactions for delete
  to anon
  using (true);

-- Authenticated policies
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
-- Comments
-- ========================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

-- Anon policies
drop policy if exists "Allow guests to create comments" on public.comments;
create policy "Allow guests to create comments"
  on public.comments for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read comments" on public.comments;
create policy "Allow public to read comments"
  on public.comments for select
  to anon
  using (true);

drop policy if exists "Allow guests to delete their own comments" on public.comments;
create policy "Allow guests to delete their own comments"
  on public.comments for delete
  to anon
  using (true);

-- Authenticated policies
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
-- Story Views
-- ========================
create table if not exists public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique(story_id, guest_id)
);

alter table public.story_views enable row level security;

-- Anon policies
drop policy if exists "Allow guests to record story views" on public.story_views;
create policy "Allow guests to record story views"
  on public.story_views for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read story views" on public.story_views;
create policy "Allow public to read story views"
  on public.story_views for select
  to anon
  using (true);

-- Authenticated policies
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
-- Story Reactions
-- ========================
create table if not exists public.story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  reaction_type text not null default 'love' check (reaction_type in ('love','celebrate','laugh','wow','pray')),
  created_at timestamptz default now(),
  unique(story_id, guest_id)
);

alter table public.story_reactions enable row level security;

-- Anon policies
drop policy if exists "Allow guests to add story reactions" on public.story_reactions;
create policy "Allow guests to add story reactions"
  on public.story_reactions for insert
  to anon
  with check (true);

drop policy if exists "Allow public to read story reactions" on public.story_reactions;
create policy "Allow public to read story reactions"
  on public.story_reactions for select
  to anon
  using (true);

drop policy if exists "Allow guests to remove story reactions" on public.story_reactions;
create policy "Allow guests to remove story reactions"
  on public.story_reactions for delete
  to anon
  using (true);

-- Authenticated policies
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
-- Grants & Indexes
-- ========================
grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant all on public.guests to anon;
grant all on public.guests to authenticated;
grant all on public.posts to anon;
grant all on public.posts to authenticated;
grant all on public.stories to anon;
grant all on public.stories to authenticated;
grant all on public.reactions to anon;
grant all on public.reactions to authenticated;
grant all on public.comments to anon;
grant all on public.comments to authenticated;
grant all on public.story_views to anon;
grant all on public.story_views to authenticated;
grant all on public.story_reactions to anon;
grant all on public.story_reactions to authenticated;

create index if not exists idx_posts_guest_id on public.posts(guest_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_stories_guest_id on public.stories(guest_id);
create index if not exists idx_stories_expires_at on public.stories(expires_at);
create index if not exists idx_reactions_post_id on public.reactions(post_id);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_story_views_story_id on public.story_views(story_id);

-- ========================
-- Storage Policies (wedding-media bucket)
-- Run after bucket exists in Storage -> wedding-media
-- ========================
drop policy if exists "Allow read wedding media" on storage.objects;
create policy "Allow read wedding media"
  on storage.objects for select
  to public
  using (bucket_id = 'wedding-media');

drop policy if exists "Allow upload wedding media" on storage.objects;
create policy "Allow upload wedding media"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'wedding-media');

drop policy if exists "Allow delete wedding media" on storage.objects;
create policy "Allow delete wedding media"
  on storage.objects for delete
  to anon
  using (bucket_id = 'wedding-media');

-- Authenticated storage policies
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
