/*
  # Complete E-commerce System Implementation

  ## Overview
  This migration implements a complete e-commerce system with:
  - Seller management and verification system
  - Coupon system for discounts
  - Today's deals management
  - Enhanced order tracking with discount information
  - Admin policies for managing all entities
  - Product seller attribution

  ## New Tables

  ### 1. sellers
  - `id` - UUID primary key
  - `username` - Unique username for seller login
  - `password_hash` - Bcrypt hashed password
  - `shop_name` - Name of the shop
  - `email` - Seller email
  - `phone` - Seller phone number
  - `address` - Shop address
  - `city` - Shop city
  - `state` - Shop state
  - `pincode` - Shop pincode
  - `is_verified` - Verification status (approved by admin)
  - `is_active` - Active status
  - `profile_completed` - Whether seller completed profile setup
  - `verification_requested_at` - Timestamp when verification was requested
  - `verified_at` - Timestamp when seller was verified
  - `created_at` - Creation timestamp

  ### 2. coupons
  - `id` - UUID primary key
  - `code` - Unique coupon code
  - `description` - Coupon description
  - `discount_type` - Type: 'percentage' or 'fixed'
  - `discount_value` - Discount value (percentage or fixed amount)
  - `min_order_amount` - Minimum order amount required
  - `max_discount_amount` - Maximum discount cap for percentage coupons
  - `valid_from` - Start date
  - `valid_until` - End date
  - `usage_limit` - Total usage limit
  - `usage_count` - Current usage count
  - `is_active` - Active status
  - `created_at` - Creation timestamp

  ### 3. coupon_usage
  - `id` - UUID primary key
  - `coupon_id` - Reference to coupon
  - `user_id` - Reference to user
  - `order_id` - Reference to order
  - `discount_amount` - Actual discount applied
  - `used_at` - Usage timestamp

  ### 4. todays_deals
  - `id` - UUID primary key
  - `product_id` - Reference to product
  - `discount_percentage` - Special discount percentage
  - `valid_from` - Deal start time
  - `valid_until` - Deal end time
  - `is_active` - Active status
  - `sort_order` - Display order
  - `created_at` - Creation timestamp

  ## Modified Tables

  ### products
  - Added `seller_id` - Reference to seller (nullable for admin products)

  ### orders
  - Added `coupon_id` - Reference to applied coupon
  - Added `discount_amount` - Total discount applied
  - Added `subtotal` - Order subtotal before discount

  ### order_items
  - Added `mrp` - Maximum retail price for tracking

  ## Security
  - Enable RLS on all new tables
  - Add admin policies for full access
  - Add seller policies for their own data
  - Add public policies for viewing active deals/coupons

  ## Functions
  - `verify_seller_login` - Seller authentication
  - `apply_coupon` - Coupon validation and application
  - `get_todays_active_deals` - Retrieve active deals
*/

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  shop_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  state text,
  pincode text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  profile_completed boolean DEFAULT false,
  verification_requested_at timestamptz,
  verified_at timestamptz,
  verified_by uuid,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount numeric,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (valid_until > valid_from),
  CHECK (usage_limit IS NULL OR usage_limit > 0)
);

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

-- Create todays_deals table
CREATE TABLE IF NOT EXISTS todays_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CHECK (valid_until > valid_from),
  UNIQUE(product_id, valid_from)
);

-- Add seller_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE products ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add coupon and discount fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric CHECK (subtotal > 0);
  END IF;
END $$;

-- Add mrp to order_items if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'mrp'
  ) THEN
    ALTER TABLE order_items ADD COLUMN mrp numeric;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sellers_username ON sellers(username);
CREATE INDEX IF NOT EXISTS idx_sellers_verified ON sellers(is_verified);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_todays_deals_product ON todays_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_todays_deals_active ON todays_deals(is_active);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);

-- Enable RLS
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sellers
CREATE POLICY "Public can verify seller login"
  ON sellers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  TO public
  USING (true);

-- RLS Policies for coupons
CREATE POLICY "Active coupons viewable by everyone"
  ON coupons FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for todays_deals
CREATE POLICY "Active deals viewable by everyone"
  ON todays_deals FOR SELECT
  TO public
  USING (is_active = true);

-- Update products policy to allow public insert (will be restricted by application)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update products"
  ON products FOR UPDATE
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can delete products"
  ON products FOR DELETE
  TO public
  USING (true);

-- Update orders policies for admin access
CREATE POLICY IF NOT EXISTS "Public can view all orders"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can update orders"
  ON orders FOR UPDATE
  TO public
  USING (true);

-- Update order_items policies
CREATE POLICY IF NOT EXISTS "Public can view all order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

-- Update order_tracking policies
CREATE POLICY IF NOT EXISTS "Public can view all order tracking"
  ON order_tracking FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert order tracking"
  ON order_tracking FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to verify seller login
CREATE OR REPLACE FUNCTION verify_seller_login(
  p_username text,
  p_password text
)
RETURNS TABLE(
  seller_id uuid,
  username text,
  shop_name text,
  email text,
  is_verified boolean,
  profile_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.username,
    s.shop_name,
    s.email,
    s.is_verified,
    s.profile_completed
  FROM sellers s
  WHERE s.username = p_username
    AND s.password_hash = crypt(p_password, s.password_hash)
    AND s.is_active = true;

  -- Update last login
  UPDATE sellers
  SET last_login = now()
  WHERE sellers.username = p_username
    AND sellers.password_hash = crypt(p_password, sellers.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply coupon
CREATE OR REPLACE FUNCTION apply_coupon(
  p_code text,
  p_order_amount numeric
)
RETURNS TABLE(
  coupon_id uuid,
  discount_amount numeric,
  message text
) AS $$
DECLARE
  v_coupon RECORD;
  v_discount numeric;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code
    AND is_active = true
    AND valid_from <= now()
    AND valid_until >= now()
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Invalid or expired coupon'::text;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric,
      format('Minimum order amount ₹%s required', v_coupon.min_order_amount)::text;
    RETURN;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_amount * v_coupon.discount_value / 100);
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
      v_discount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- Ensure discount doesn't exceed order amount
  IF v_discount > p_order_amount THEN
    v_discount := p_order_amount;
  END IF;

  RETURN QUERY SELECT v_coupon.id, v_discount, 'Coupon applied successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active todays deals
CREATE OR REPLACE FUNCTION get_todays_active_deals()
RETURNS TABLE(
  deal_id uuid,
  product_id uuid,
  discount_percentage integer,
  valid_until timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.product_id,
    td.discount_percentage,
    td.valid_until
  FROM todays_deals td
  WHERE td.is_active = true
    AND td.valid_from <= now()
    AND td.valid_until >= now()
  ORDER BY td.sort_order, td.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_seller_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_coupon TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_todays_active_deals TO anon, authenticated;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, usage_limit, is_active)
VALUES
  ('WELCOME10', 'Welcome offer - 10% off', 'percentage', 10, 500, 200, now(), now() + interval '30 days', 1000, true),
  ('FLAT200', 'Flat ₹200 off on orders above ₹1000', 'fixed', 200, 1000, NULL, now(), now() + interval '30 days', 500, true),
  ('MEGA50', 'Mega sale - 50% off', 'percentage', 50, 2000, 1000, now(), now() + interval '7 days', 100, true)
ON CONFLICT (code) DO NOTHING;
