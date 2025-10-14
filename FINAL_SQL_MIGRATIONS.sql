/*
  # Complete E-commerce System - Final Migrations

  This migration includes:
  1. Stock decrease on order completion
  2. Today's Deals RPC function fix
  3. Split orders by seller
  4. All necessary views and functions

  Run this in Supabase SQL Editor
*/

-- ============================================
-- 1. FIX TODAY'S DEALS RPC FUNCTION
-- ============================================

-- Create or replace the function to get active deals with product data
CREATE OR REPLACE FUNCTION get_todays_active_deals()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  deal_price numeric,
  original_price numeric,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean,
  created_at timestamptz,
  product jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.product_id,
    td.deal_price,
    td.original_price,
    td.starts_at,
    td.ends_at,
    td.is_active,
    td.created_at,
    to_jsonb(p.*) as product
  FROM todays_deals td
  JOIN products p ON p.id = td.product_id
  WHERE td.is_active = true
    AND td.starts_at <= now()
    AND td.ends_at >= now()
    AND p.is_active = true
  ORDER BY td.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. STOCK DECREASE ON ORDER COMPLETION
-- ============================================

-- Function to decrease stock when order is confirmed
CREATE OR REPLACE FUNCTION decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrease stock when payment is completed
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    -- Decrease stock for all items in the order
    UPDATE products p
    SET
      stock_quantity = GREATEST(0, p.stock_quantity - oi.quantity),
      stock = GREATEST(0, p.stock - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock decrease
DROP TRIGGER IF EXISTS decrease_stock_on_order_trigger ON orders;
CREATE TRIGGER decrease_stock_on_order_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed' AND OLD.payment_status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION decrease_stock_on_order();

-- ============================================
-- 3. REVIEWS TABLE AND AUTO-VERIFICATION
-- ============================================

-- Ensure reviews table exists
CREATE TABLE IF NOT EXISTS reviews (
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
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

-- Auto-verify reviews for users who purchased
CREATE OR REPLACE FUNCTION auto_verify_review()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS auto_verify_review_trigger ON reviews;
CREATE TRIGGER auto_verify_review_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_review();

-- ============================================
-- 4. SPLIT ORDERS BY SELLER
-- ============================================

-- Add seller_id to order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN seller_id uuid REFERENCES sellers(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

-- Auto-set seller_id from product
CREATE OR REPLACE FUNCTION set_order_item_seller()
RETURNS TRIGGER AS $$
BEGIN
  SELECT seller_id INTO NEW.seller_id
  FROM products
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_item_seller_trigger ON order_items;
CREATE TRIGGER set_order_item_seller_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_order_item_seller();

-- Update existing order_items
UPDATE order_items oi
SET seller_id = p.seller_id
FROM products p
WHERE oi.product_id = p.id
AND oi.seller_id IS NULL;

-- ============================================
-- 5. SELLER ORDERS VIEW
-- ============================================

CREATE OR REPLACE VIEW seller_orders_view AS
SELECT
  o.id as order_id,
  o.user_id,
  o.created_at as order_date,
  o.status,
  o.payment_status,
  o.payment_id,
  o.total_amount as order_total,
  oi.seller_id,
  oi.id as order_item_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  oi.selected_size,
  oi.selected_color,
  (oi.quantity * oi.price) as item_total,
  p.name as product_name,
  p.images as product_images,
  p.category as product_category,
  a.name as customer_name,
  a.phone as customer_phone,
  a.street,
  a.city,
  a.state,
  a.pincode,
  u.email as customer_email
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
JOIN addresses a ON a.id = o.address_id
LEFT JOIN auth.users u ON u.id = o.user_id;

-- Grant permission
GRANT SELECT ON seller_orders_view TO authenticated;

-- ============================================
-- 6. ADMIN ORDERS VIEW WITH SELLER INFO
-- ============================================

CREATE OR REPLACE VIEW admin_orders_detailed AS
SELECT
  o.id as order_id,
  o.user_id,
  o.total_amount,
  o.subtotal,
  o.discount_amount,
  o.status,
  o.payment_status,
  o.payment_id,
  o.created_at,
  o.updated_at,
  a.name as customer_name,
  a.phone as customer_phone,
  a.street || ', ' || a.city || ', ' || a.state || ' - ' || a.pincode as full_address,
  json_agg(
    json_build_object(
      'item_id', oi.id,
      'product_id', oi.product_id,
      'product_name', p.name,
      'product_image', p.images->0,
      'quantity', oi.quantity,
      'price', oi.price,
      'size', oi.selected_size,
      'color', oi.selected_color,
      'seller_id', oi.seller_id,
      'seller_name', s.shop_name,
      'item_total', (oi.quantity * oi.price)
    ) ORDER BY oi.created_at
  ) as items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
LEFT JOIN sellers s ON s.id = oi.seller_id
JOIN addresses a ON a.id = o.address_id
GROUP BY o.id, a.id;

GRANT SELECT ON admin_orders_detailed TO authenticated;

-- ============================================
-- 7. USER ORDERS VIEW (GROUPED BY SELLER)
-- ============================================

CREATE OR REPLACE VIEW user_orders_view AS
SELECT
  o.id as order_id,
  o.user_id,
  o.total_amount,
  o.status,
  o.payment_status,
  o.created_at,
  COUNT(DISTINCT oi.seller_id) as seller_count,
  json_agg(
    DISTINCT jsonb_build_object(
      'seller_id', oi.seller_id,
      'seller_name', COALESCE(s.shop_name, 'Admin'),
      'items', (
        SELECT json_agg(
          json_build_object(
            'product_id', oi2.product_id,
            'product_name', p2.name,
            'quantity', oi2.quantity,
            'price', oi2.price
          )
        )
        FROM order_items oi2
        JOIN products p2 ON p2.id = oi2.product_id
        WHERE oi2.order_id = o.id
        AND (oi2.seller_id = oi.seller_id OR (oi2.seller_id IS NULL AND oi.seller_id IS NULL))
      )
    )
  ) as sellers_items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN sellers s ON s.id = oi.seller_id
GROUP BY o.id;

GRANT SELECT ON user_orders_view TO authenticated;

-- ============================================
-- 8. PAYMENT TRACKING IMPROVEMENTS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_initiated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_initiated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_order_id text;
  END IF;
END $$;

-- Set payment initiated timestamp
CREATE OR REPLACE FUNCTION set_payment_initiated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'pending' AND (OLD.payment_initiated_at IS NULL OR OLD.id IS NULL) THEN
    NEW.payment_initiated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_initiated_trigger ON orders;
CREATE TRIGGER set_payment_initiated_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_initiated();

-- Function to cancel unpaid orders
CREATE OR REPLACE FUNCTION cancel_unpaid_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled',
      payment_status = 'failed'
  WHERE payment_status = 'pending'
  AND payment_initiated_at IS NOT NULL
  AND payment_initiated_at < now() - interval '30 minutes'
  AND status NOT IN ('cancelled', 'delivered', 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. PRODUCT RATING UPDATES
-- ============================================

-- Update product rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_rating_trigger ON reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON reviews TO authenticated;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT ON seller_orders_view TO authenticated;
GRANT SELECT ON admin_orders_detailed TO authenticated;
GRANT SELECT ON user_orders_view TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================

-- Check if Today's Deals function works
-- SELECT * FROM get_todays_active_deals();

-- Check seller orders
-- SELECT * FROM seller_orders_view WHERE seller_id = 'your-seller-id' LIMIT 5;

-- Check admin orders
-- SELECT * FROM admin_orders_detailed LIMIT 5;

-- Check user orders
-- SELECT * FROM user_orders_view WHERE user_id = 'your-user-id' LIMIT 5;

-- Test stock decrease (after completing an order)
-- SELECT id, name, stock_quantity FROM products WHERE id = 'product-id';
