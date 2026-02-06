-- =============================================
-- MIGRATION 001: Stickiness Features
-- Content Library + Post Generator
-- =============================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- IMPORTANT: Run AFTER the initial schema (supabase-schema.sql)

-- =============================================
-- 1. ADD updated_at TO content_items
-- =============================================

-- Add updated_at column for "stale" item detection
ALTER TABLE content_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Backfill existing rows: set updated_at = created_at
UPDATE content_items
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on content_items
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for sorting/filtering by updated_at
CREATE INDEX IF NOT EXISTS content_items_updated_at_idx ON content_items(updated_at DESC);

-- =============================================
-- 2. SAVED VIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  -- filters schema: { platform?, status?, search?, dateRange?, isStale?, isActionCenter? }
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS saved_views_user_id_idx ON saved_views(user_id);

-- Enable RLS
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_views
DROP POLICY IF EXISTS "Users can view own saved views" ON saved_views;
CREATE POLICY "Users can view own saved views"
  ON saved_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create saved views" ON saved_views;
CREATE POLICY "Users can create saved views"
  ON saved_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved views" ON saved_views;
CREATE POLICY "Users can update own saved views"
  ON saved_views FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved views" ON saved_views;
CREATE POLICY "Users can delete own saved views"
  ON saved_views FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 3. OUTPUT SLOTS TABLE (Versioned AI Outputs)
-- =============================================

CREATE TABLE IF NOT EXISTS output_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_type text NOT NULL CHECK (slot_type IN ('title', 'description', 'hashtags', 'pinned_comment')),
  variant text NOT NULL DEFAULT 'v1',
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for output_slots
CREATE INDEX IF NOT EXISTS output_slots_content_item_idx ON output_slots(content_item_id);
CREATE INDEX IF NOT EXISTS output_slots_user_id_idx ON output_slots(user_id);
-- Composite index for fetching all slots for an item
CREATE INDEX IF NOT EXISTS output_slots_item_type_idx ON output_slots(content_item_id, slot_type);

-- Enable RLS
ALTER TABLE output_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for output_slots
DROP POLICY IF EXISTS "Users can view own output slots" ON output_slots;
CREATE POLICY "Users can view own output slots"
  ON output_slots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create output slots" ON output_slots;
CREATE POLICY "Users can create output slots"
  ON output_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own output slots" ON output_slots;
CREATE POLICY "Users can update own output slots"
  ON output_slots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own output slots" ON output_slots;
CREATE POLICY "Users can delete own output slots"
  ON output_slots FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 4. COMPOSITE INDEXES FOR ACTION CENTER
-- =============================================

-- Index for status filtering (Action Center: ideas/drafts)
CREATE INDEX IF NOT EXISTS content_items_status_idx ON content_items(status);

-- Composite index for Action Center queries
CREATE INDEX IF NOT EXISTS content_items_user_status_idx ON content_items(user_id, status);

-- =============================================
-- VERIFICATION QUERIES (Optional)
-- =============================================

-- Uncomment and run to verify migration:

-- Check updated_at column exists
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'content_items' AND column_name = 'updated_at';

-- Check new tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('saved_views', 'output_slots');

-- Check RLS is enabled on new tables
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('saved_views', 'output_slots');

-- Check policies exist
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('saved_views', 'output_slots');

-- Test the updated_at trigger (create a test item, update it, check updated_at changed)
