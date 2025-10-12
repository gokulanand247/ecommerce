/*
  # Complete E-commerce Improvements Migration

  This file contains all SQL migrations needed for:
  1. User Reviews with Real-time Updates
  2. Split Orders by Seller
  3. Order Payment Status Improvements
  4. Seller Information Enhancements

  ## Instructions:
  Run this in your Supabase SQL Editor or apply as a migration.
*/

-- ============================================
-- 1. REVIEWS TABLE IMPROVEMENTS
-- ============================================

-- Ensure reviews table exists with all necessary columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    CREATE TABLE reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment text,
      images jsonb DEFAULT '[]'::jsonb,
      is_verified boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to auto-verify reviews for users who purchased the product
CREATE OR REPLACE FUNCTION auto_verify_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has purchased this product
  NEW.is_verified := EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
    AND oi.product_id = NEW.product_id
    AND o.payment_status = 'completed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-verify reviews
DROP TRIGGER IF EXISTS auto_verify_review_trigger ON reviews;
CREATE TRIGGER auto_verify_review_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_review();

-- ============================================
-- 2. SPLIT ORDERS BY SELLER
-- ============================================

-- Add seller_id to order_items to track which seller each item belongs to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN seller_id uuid REFERENCES sellers(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

-- Function to automatically set seller_id when order items are inserted
CREATE OR REPLACE FUNCTION set_order_item_seller()
RETURNS TRIGGER AS $$
BEGIN
  -- Get seller_id from the product
  SELECT seller_id INTO NEW.seller_id
  FROM products
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set seller_id
DROP TRIGGER IF EXISTS set_order_item_seller_trigger ON order_items;
CREATE TRIGGER set_order_item_seller_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_order_item_seller();

-- Update existing order_items to have seller_id
UPDATE order_items oi
SET seller_id = p.seller_id
FROM products p
WHERE oi.product_id = p.id
AND oi.seller_id IS NULL;

-- Create a view for seller-specific orders
CREATE OR REPLACE VIEW seller_orders AS
SELECT
  o.id as order_id,
  o.user_id,
  o.created_at as order_date,
  o.status,
  o.payment_status,
  oi.seller_id,
  s.shop_name as seller_name,
  oi.id as order_item_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  oi.selected_size,
  oi.selected_color,
  p.name as product_name,
  p.images as product_images,
  a.name as customer_name,
  a.phone as customer_phone,
  a.street,
  a.city,
  a.state,
  a.pincode
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN sellers s ON s.id = oi.seller_id
JOIN products p ON p.id = oi.product_id
JOIN addresses a ON a.id = o.address_id;

-- ============================================
-- 3. ORDER PAYMENT STATUS IMPROVEMENTS
-- ============================================

-- Add payment_initiated_at column to track when payment was started
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_initiated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_initiated_at timestamptz;
  END IF;
END $$;

-- Add razorpay_order_id for webhook verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_order_id text;
  END IF;
END $$;

-- Function to set payment initiated timestamp
CREATE OR REPLACE FUNCTION set_payment_initiated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'pending' AND OLD.payment_initiated_at IS NULL THEN
    NEW.payment_initiated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment initiated
DROP TRIGGER IF EXISTS set_payment_initiated_trigger ON orders;
CREATE TRIGGER set_payment_initiated_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_initiated();

-- Function to auto-cancel unpaid orders after 30 minutes
CREATE OR REPLACE FUNCTION cancel_unpaid_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled',
      payment_status = 'failed'
  WHERE payment_status = 'pending'
  AND payment_initiated_at IS NOT NULL
  AND payment_initiated_at < now() - interval '30 minutes'
  AND status NOT IN ('cancelled', 'delivered');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. SELLER INFORMATION ENHANCEMENTS
-- ============================================

-- Ensure sellers table has all necessary columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'shop_name'
  ) THEN
    ALTER TABLE sellers ADD COLUMN shop_name text NOT NULL DEFAULT 'Shop';
  END IF;
END $$;

-- Add shop description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'shop_description'
  ) THEN
    ALTER TABLE sellers ADD COLUMN shop_description text;
  END IF;
END $$;

-- ============================================
-- 5. ADMIN ORDERS VIEW WITH SELLER INFO
-- ============================================

-- Create enhanced admin orders view
CREATE OR REPLACE VIEW admin_orders_view AS
SELECT
  o.id,
  o.user_id,
  o.total_amount,
  o.subtotal,
  o.discount_amount,
  o.status,
  o.payment_status,
  o.payment_id,
  o.payment_initiated_at,
  o.created_at,
  o.updated_at,
  json_agg(
    json_build_object(
      'product_id', oi.product_id,
      'product_name', p.name,
      'quantity', oi.quantity,
      'price', oi.price,
      'seller_id', oi.seller_id,
      'seller_name', s.shop_name
    )
  ) as items,
  a.name as customer_name,
  a.phone as customer_phone,
  a.street || ', ' || a.city || ', ' || a.state || ' - ' || a.pincode as full_address
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
LEFT JOIN sellers s ON s.id = oi.seller_id
JOIN addresses a ON a.id = o.address_id
GROUP BY o.id, a.id;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant permissions for reviews
GRANT SELECT ON reviews TO public;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

-- Grant permissions for views
GRANT SELECT ON seller_orders TO authenticated;
GRANT SELECT ON admin_orders_view TO authenticated;

-- ============================================
-- 7. HELPFUL QUERIES FOR TESTING
-- ============================================

-- Query to see orders split by seller for a specific seller
-- SELECT * FROM seller_orders WHERE seller_id = 'your-seller-id' ORDER BY order_date DESC;

-- Query to see all orders with seller information (admin view)
-- SELECT * FROM admin_orders_view ORDER BY created_at DESC;

-- Query to cancel unpaid orders (run periodically or via cron job)
-- SELECT cancel_unpaid_orders();

-- Query to see product ratings
-- SELECT p.id, p.name, p.average_rating, COUNT(r.id) as review_count
-- FROM products p
-- LEFT JOIN reviews r ON r.product_id = p.id
-- GROUP BY p.id, p.name, p.average_rating;
