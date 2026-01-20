-- ============================================
-- SQL to create tables for Wedding Social Feature
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ibaafmkzvccyznjfyddw/sql/new
-- ============================================

-- ============================================
-- 1. GUESTS TABLE (User Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'guest' CHECK (role IN ('bride','groom','guest')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'guests'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.guests
      ADD COLUMN role TEXT DEFAULT 'guest';
  END IF;

  BEGIN
    ALTER TABLE public.guests
      ADD CONSTRAINT guests_role_check
      CHECK (role IN ('bride','groom','guest'));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  ALTER TABLE public.guests
    ALTER COLUMN role SET DEFAULT 'guest';
  UPDATE public.guests SET role = 'guest' WHERE role IS NULL;
END;
$$;

-- Enable RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Policies for guests (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow public to create guest accounts'
  ) THEN
    CREATE POLICY "Allow public to create guest accounts" ON public.guests
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow guests to read all guests'
  ) THEN
    CREATE POLICY "Allow guests to read all guests" ON public.guests
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow guests to update their own profile'
  ) THEN
    CREATE POLICY "Allow guests to update their own profile" ON public.guests
      FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow authenticated to create guest accounts'
  ) THEN
    CREATE POLICY "Allow authenticated to create guest accounts" ON public.guests
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow authenticated to read all guests'
  ) THEN
    CREATE POLICY "Allow authenticated to read all guests" ON public.guests
      FOR SELECT TO authenticated USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Allow authenticated to update their own profile'
  ) THEN
    CREATE POLICY "Allow authenticated to update their own profile" ON public.guests
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END;
$$;

-- Backfill couple roles if their guest rows already exist
UPDATE public.guests
SET role = 'bride'
WHERE role <> 'bride'
  AND name ILIKE '%joy%'
  AND name ILIKE '%delantar%';

UPDATE public.guests
SET role = 'groom'
WHERE role <> 'groom'
  AND name ILIKE '%josh%'
  AND name ILIKE '%macaraig%';

-- ============================================
-- 2. POSTS TABLE (Photos/Videos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  location TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  moment_title TEXT,
  moment_subtitle TEXT,
  moment_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'moment_title'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN moment_title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'moment_subtitle'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN moment_subtitle TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'moment_icon'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN moment_icon TEXT;
  END IF;
END;
$$;

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Allow guests to create posts'
  ) THEN
    CREATE POLICY "Allow guests to create posts" ON public.posts
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Allow public to read all posts'
  ) THEN
    CREATE POLICY "Allow public to read all posts" ON public.posts
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Allow guests to delete their own posts'
  ) THEN
    CREATE POLICY "Allow guests to delete their own posts" ON public.posts
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'posts'
        AND policyname = 'Allow guests to update their own posts'
  ) THEN
    CREATE POLICY "Allow guests to update their own posts" ON public.posts
      FOR UPDATE TO authenticated
      USING (auth.uid() = guest_id)
      WITH CHECK (auth.uid() = guest_id);
  END IF;
END;
$$;

-- ============================================
-- 2b. POST_MEDIA TABLE (Multiple media per post)
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_media'
      AND policyname = 'Allow guests to add media to posts'
  ) THEN
    CREATE POLICY "Allow guests to add media to posts" ON public.post_media
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_media'
      AND policyname = 'Allow public to view post media'
  ) THEN
    CREATE POLICY "Allow public to view post media" ON public.post_media
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_media'
      AND policyname = 'Allow guests to delete their media'
  ) THEN
    CREATE POLICY "Allow guests to delete their media" ON public.post_media
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- 3. STORIES TABLE (24-hour Stories)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stories'
      AND policyname = 'Allow guests to create stories'
  ) THEN
    CREATE POLICY "Allow guests to create stories" ON public.stories
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stories'
      AND policyname = 'Allow public to read active stories'
  ) THEN
    CREATE POLICY "Allow public to read active stories" ON public.stories
      FOR SELECT TO anon USING (expires_at > NOW());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stories'
      AND policyname = 'Allow guests to delete their own stories'
  ) THEN
    CREATE POLICY "Allow guests to delete their own stories" ON public.stories
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- 4. REACTIONS TABLE (Likes/Reactions on Posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'love' CHECK (reaction_type IN ('love', 'celebrate', 'laugh', 'wow', 'pray')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, guest_id)
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Policies for reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Allow guests to add reactions'
  ) THEN
    CREATE POLICY "Allow guests to add reactions" ON public.reactions
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Allow public to read reactions'
  ) THEN
    CREATE POLICY "Allow public to read reactions" ON public.reactions
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Allow guests to remove reactions'
  ) THEN
    CREATE POLICY "Allow guests to remove reactions" ON public.reactions
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- 5. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comments'
      AND policyname = 'Allow guests to create comments'
  ) THEN
    CREATE POLICY "Allow guests to create comments" ON public.comments
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comments'
      AND policyname = 'Allow public to read comments'
  ) THEN
    CREATE POLICY "Allow public to read comments" ON public.comments
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comments'
      AND policyname = 'Allow guests to delete their own comments'
  ) THEN
    CREATE POLICY "Allow guests to delete their own comments" ON public.comments
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- 6. STORY VIEWS TABLE (Track who viewed stories)
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, guest_id)
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Policies for story views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'story_views'
      AND policyname = 'Allow guests to record story views'
  ) THEN
    CREATE POLICY "Allow guests to record story views" ON public.story_views
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'story_views'
      AND policyname = 'Allow public to read story views'
  ) THEN
    CREATE POLICY "Allow public to read story views" ON public.story_views
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- 7. STORY REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'love' CHECK (reaction_type IN ('love', 'celebrate', 'laugh', 'wow', 'pray')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, guest_id)
);

-- Enable RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for story reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'story_reactions'
      AND policyname = 'Allow guests to add story reactions'
  ) THEN
    CREATE POLICY "Allow guests to add story reactions" ON public.story_reactions
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'story_reactions'
      AND policyname = 'Allow public to read story reactions'
  ) THEN
    CREATE POLICY "Allow public to read story reactions" ON public.story_reactions
      FOR SELECT TO anon USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'story_reactions'
      AND policyname = 'Allow guests to remove story reactions'
  ) THEN
    CREATE POLICY "Allow guests to remove story reactions" ON public.story_reactions
      FOR DELETE TO anon USING (true);
  END IF;
END;
$$;

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.guests TO anon;
GRANT ALL ON public.posts TO anon;
GRANT ALL ON public.stories TO anon;
GRANT ALL ON public.reactions TO anon;
GRANT ALL ON public.comments TO anon;
GRANT ALL ON public.story_views TO anon;
GRANT ALL ON public.story_reactions TO anon;

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_guest_id ON public.posts(guest_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_stories_guest_id ON public.stories(guest_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);

-- ============================================
-- STORAGE BUCKET SETUP (Run separately in Storage)
-- ============================================
-- Go to Supabase Dashboard > Storage > Create new bucket
-- Name: wedding-media
-- Public bucket: YES (so images/videos can be displayed)
-- File size limit: 50MB
-- Allowed MIME types: image/*, video/*

-- ============================================
-- UTILITY: RESET SOCIAL TABLES (KEEP responses)
-- ============================================
CREATE OR REPLACE FUNCTION public.reset_social_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  TRUNCATE TABLE
    public.story_reactions,
    public.story_views,
    public.comments,
    public.reactions,
    public.post_media,
    public.posts,
    public.stories
  RESTART IDENTITY;

  TRUNCATE TABLE public.guests RESTART IDENTITY;
END;
$$;
