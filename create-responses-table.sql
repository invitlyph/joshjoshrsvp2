-- ============================================
-- SQL to create the responses table for RSVP
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ibaafmkzvccyznjfyddw/sql/new
-- ============================================

-- Create the responses table
CREATE TABLE IF NOT EXISTS public.responses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  guest_count INTEGER DEFAULT 1,
  guest_names TEXT,
  status TEXT NOT NULL DEFAULT 'yes',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to INSERT (submit RSVP)
CREATE POLICY "Allow public insert" ON public.responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow anyone to SELECT (read responses)
-- Remove this if you only want admin to see responses
CREATE POLICY "Allow public read" ON public.responses
  FOR SELECT
  TO anon
  USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON public.responses TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.responses_id_seq TO anon;

-- ============================================
-- OPTIONAL: Create a view for easy admin access
-- ============================================
-- CREATE VIEW public.rsvp_summary AS
-- SELECT 
--   name,
--   guest_count,
--   guest_names,
--   status,
--   message,
--   created_at
-- FROM public.responses
-- ORDER BY created_at DESC;
