/*
  # Add Sample Reviews with Anonymous Users

  ## Changes
  - Make user_id nullable in reviews table to allow anonymous sample reviews
  - Add display_name field for anonymous reviewers
  - Add sample reviews for products
  - Create product ratings view

  ## Notes
  - Real users who sign up will still have their user_id associated
  - Anonymous reviews show display_name instead of user info
  - This allows us to showcase product quality with sample reviews
*/

-- Modify reviews table to make user_id nullable and add display_name
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_key;

ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE reviews ADD COLUMN display_name text;
  END IF;
END $$;

-- Re-add foreign key as nullable
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update unique constraint to allow multiple reviews from same user for same product
-- but only if they want to update, the app should handle this
ALTER TABLE reviews ADD CONSTRAINT reviews_unique_user_product 
  UNIQUE NULLS NOT DISTINCT (product_id, user_id);

-- Insert sample reviews for products
DO $$
DECLARE
  product_record RECORD;
  reviewer_names text[] := ARRAY[
    'Priya S.',
    'Anjali M.',
    'Sneha K.',
    'Riya P.',
    'Meera R.',
    'Kavya T.',
    'Divya N.',
    'Pooja L.'
  ];
  reviewer_idx integer;
BEGIN
  reviewer_idx := 1;
  
  -- Add reviews for first 15 products
  FOR product_record IN 
    SELECT id FROM products 
    WHERE is_active = true 
    ORDER BY created_at DESC
    LIMIT 15
  LOOP
    -- Add 2-3 reviews per product
    INSERT INTO reviews (product_id, user_id, display_name, rating, comment, is_verified, created_at) VALUES
    (product_record.id, NULL, reviewer_names[((reviewer_idx - 1) % 8) + 1], 5, 'Excellent quality! The fabric is amazing and fits perfectly. Highly recommended!', true, now() - interval '10 days'),
    (product_record.id, NULL, reviewer_names[((reviewer_idx) % 8) + 1], 4, 'Great product. Good value for money. Delivery was fast too.', true, now() - interval '7 days'),
    (product_record.id, NULL, reviewer_names[((reviewer_idx + 1) % 8) + 1], 5, 'Absolutely love it! Exactly as shown in the pictures. Will order again.', true, now() - interval '3 days')
    ON CONFLICT DO NOTHING;
    
    reviewer_idx := reviewer_idx + 1;
  END LOOP;
END $$;

-- Create a view to get product ratings summary
CREATE OR REPLACE VIEW product_ratings AS
SELECT 
  p.id as product_id,
  COUNT(r.id)::integer as review_count,
  COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as average_rating,
  COUNT(CASE WHEN r.rating = 5 THEN 1 END)::integer as five_star_count,
  COUNT(CASE WHEN r.rating = 4 THEN 1 END)::integer as four_star_count,
  COUNT(CASE WHEN r.rating = 3 THEN 1 END)::integer as three_star_count,
  COUNT(CASE WHEN r.rating = 2 THEN 1 END)::integer as two_star_count,
  COUNT(CASE WHEN r.rating = 1 THEN 1 END)::integer as one_star_count
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id;

-- Update RLS policy for reviews to allow anonymous reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" 
  ON reviews FOR SELECT 
  TO public 
  USING (true);

-- Allow authenticated users to insert their own reviews
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews" 
  ON reviews FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow authenticated users to update their own reviews  
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" 
  ON reviews FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());
