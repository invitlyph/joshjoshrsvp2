-- Reset Wedding Social Tables + Auth Users + Storage
-- This will delete all data from wedding social tables, auth users, and storage
-- while preserving the 'responses' table
-- Run this in your Supabase SQL Editor

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Delete in order respecting foreign key constraints
-- (child tables first, then parent tables)

-- Delete story-related data
TRUNCATE TABLE public.story_reactions CASCADE;
TRUNCATE TABLE public.story_views CASCADE;
TRUNCATE TABLE public.stories CASCADE;

-- Delete post-related data
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.reactions CASCADE;
TRUNCATE TABLE public.posts CASCADE;

-- Delete wishes
TRUNCATE TABLE public.wishes CASCADE;

-- Delete guests (this is the parent table)
TRUNCATE TABLE public.guests CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Delete ALL auth users
DELETE FROM auth.users;

-- Delete ALL files from storage buckets
DELETE FROM storage.objects WHERE bucket_id = 'wedding-media';

-- Verify tables are empty
SELECT 'guests' as table_name, COUNT(*) as row_count FROM public.guests
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts
UNION ALL
SELECT 'stories', COUNT(*) FROM public.stories
UNION ALL
SELECT 'reactions', COUNT(*) FROM public.reactions
UNION ALL
SELECT 'comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'story_views', COUNT(*) FROM public.story_views
UNION ALL
SELECT 'story_reactions', COUNT(*) FROM public.story_reactions
UNION ALL
SELECT 'wishes', COUNT(*) FROM public.wishes
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'storage.objects', COUNT(*) FROM storage.objects WHERE bucket_id = 'wedding-media';
