/*
  # Fix Reviews System

  This migration fixes review submission issues:
  1. Ensures proper permissions for authenticated users
  2. Adds proper validation
  3. Fixes any schema issues
*/

-- Ensure reviews table has all necessary columns
DO $$
BEGIN
  -- Add helpful_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;

  -- Add verified_purchase if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'verified_purchase'
  ) THEN
    ALTER TABLE reviews ADD COLUMN verified_purchase BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can edit own reviews" ON reviews;

-- Recreate policies with proper permissions

-- Anyone can view reviews (including anonymous users)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add constraint to ensure rating is between 1 and 5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_check'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Add constraint to ensure comment is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_comment_not_empty'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_comment_not_empty CHECK (length(trim(comment)) > 0);
  END IF;
END $$;
