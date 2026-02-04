-- =============================================
-- SUPABASE SQL SCHEMA
-- Content Library + Post Generator
-- =============================================

-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create the content_items table
CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'facebook', 'instagram', 'tiktok')),
  status text NOT NULL CHECK (status IN ('idea', 'draft', 'posted')),
  notes text,
  yt_link text,
  tags text
);

-- 2. Create an index on user_id for faster queries
CREATE INDEX content_items_user_id_idx ON content_items(user_id);

-- 3. Create an index on created_at for faster sorting
CREATE INDEX content_items_created_at_idx ON content_items(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Policy: Users can SELECT their own rows
CREATE POLICY "Users can view own content items"
  ON content_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can INSERT their own rows
CREATE POLICY "Users can create content items"
  ON content_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own rows
CREATE POLICY "Users can update own content items"
  ON content_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own rows
CREATE POLICY "Users can delete own content items"
  ON content_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- VERIFICATION (Optional - run to check setup)
-- =============================================

-- Check table exists and structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'content_items';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'content_items';

-- Check policies exist
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'content_items';
