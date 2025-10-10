/*
  # Complete Fresh E-commerce Database Setup

  This migration creates a complete e-commerce system from scratch with:
  - User management
  - Product catalog with seller attribution
  - Order management with coupon support
  - Seller system with verification
  - Coupon/discount system
  - Today's deals
  - Admin system
  - Complete RLS policies

  ## Tables Created:
  1. users - Customer accounts
  2. addresses - Customer delivery addresses
  3. products - Product catalog
  4. orders - Order records
  5. order_items - Order line items
  6. order_tracking - Order status tracking
  7. reviews - Product reviews
  8. banners - Homepage banners
  9. sellers - Seller accounts
  10. admins - Admin accounts
  11. coupons - Discount coupons
  12. coupon_usage - Coupon usage tracking
  13. todays_deals - Special deals
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (fresh start)
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS todays_deals CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Addresses table
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Sellers table
CREATE TABLE sellers (
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

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  mrp numeric NOT NULL CHECK (mrp >= 0),
  category text NOT NULL,
  image_url text,
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  stock integer DEFAULT 0 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coupons table
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount numeric CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count integer DEFAULT 0 CHECK (usage_count >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (valid_until > valid_from)
);

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id uuid NOT NULL REFERENCES addresses(id),
  subtotal numeric NOT NULL CHECK (subtotal > 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  payment_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  tracking_number text,
  expected_delivery date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price > 0),
  mrp numeric NOT NULL CHECK (mrp > 0),
  selected_size text,
  selected_color text,
  created_at timestamptz DEFAULT now()
);

-- Order tracking table
CREATE TABLE order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Coupon usage table
CREATE TABLE coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

-- Today's deals table
CREATE TABLE todays_deals (
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

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Banners table
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  button_text text DEFAULT 'Shop Now',
  link_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Admins table
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_sellers_username ON sellers(username);
CREATE INDEX idx_sellers_verified ON sellers(is_verified);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_todays_deals_product ON todays_deals(product_id);
CREATE INDEX idx_todays_deals_active ON todays_deals(is_active);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public access (secured at application level)
CREATE POLICY "Public access" ON users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON addresses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON order_tracking FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON reviews FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON banners FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON sellers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON admins FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON coupons FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON coupon_usage FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON todays_deals FOR ALL TO public USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(p_username text, p_password text)
RETURNS TABLE(admin_id uuid, username text, email text, name text) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username, a.email, a.name
  FROM admins a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash)
    AND a.is_active = true;

  UPDATE admins SET last_login = now()
  WHERE admins.username = p_username
    AND admins.password_hash = crypt(p_password, admins.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify seller login
CREATE OR REPLACE FUNCTION verify_seller_login(p_username text, p_password text)
RETURNS TABLE(seller_id uuid, username text, shop_name text, email text, is_verified boolean, profile_completed boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.username, s.shop_name, s.email, s.is_verified, s.profile_completed
  FROM sellers s
  WHERE s.username = p_username
    AND s.password_hash = crypt(p_password, s.password_hash)
    AND s.is_active = true;

  UPDATE sellers SET last_login = now()
  WHERE sellers.username = p_username
    AND sellers.password_hash = crypt(p_password, sellers.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Apply coupon
CREATE OR REPLACE FUNCTION apply_coupon(p_code text, p_order_amount numeric)
RETURNS TABLE(coupon_id uuid, discount_amount numeric, message text) AS $$
DECLARE
  v_coupon RECORD;
  v_discount numeric;
BEGIN
  SELECT * INTO v_coupon FROM coupons
  WHERE code = p_code AND is_active = true
    AND valid_from <= now() AND valid_until >= now()
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Invalid or expired coupon'::text;
    RETURN;
  END IF;

  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT NULL::uuid, 0::numeric, format('Minimum order amount ₹%s required', v_coupon.min_order_amount)::text;
    RETURN;
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_amount * v_coupon.discount_value / 100);
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
      v_discount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  IF v_discount > p_order_amount THEN
    v_discount := p_order_amount;
  END IF;

  RETURN QUERY SELECT v_coupon.id, v_discount, 'Coupon applied successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get active deals
CREATE OR REPLACE FUNCTION get_todays_active_deals()
RETURNS TABLE(deal_id uuid, product_id uuid, discount_percentage integer, valid_until timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT td.id, td.product_id, td.discount_percentage, td.valid_until
  FROM todays_deals td
  WHERE td.is_active = true AND td.valid_from <= now() AND td.valid_until >= now()
  ORDER BY td.sort_order, td.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_seller_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_coupon TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_todays_active_deals TO anon, authenticated;

-- Insert default admin
INSERT INTO admins (username, password_hash, email, name, is_active)
VALUES (
  'admin',
  crypt('Admin@123', gen_salt('bf')),
  'admin@dresshub.com',
  'System Administrator',
  true
);

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, usage_limit, is_active)
VALUES
  ('WELCOME10', 'Welcome offer - 10% off', 'percentage', 10, 500, 200, now(), now() + interval '30 days', 1000, true),
  ('FLAT200', 'Flat ₹200 off on orders above ₹1000', 'fixed', 200, 1000, NULL, now(), now() + interval '30 days', 500, true),
  ('MEGA50', 'Mega sale - 50% off', 'percentage', 50, 2000, 1000, now(), now() + interval '7 days', 100, true);

-- Insert sample seller
INSERT INTO sellers (username, password_hash, shop_name, email, phone, is_active, is_verified, profile_completed, verified_at)
VALUES (
  'seller1',
  crypt('Seller@123', gen_salt('bf')),
  'Fashion Boutique',
  'seller1@example.com',
  '9876543210',
  true,
  true,
  true,
  now()
);

-- Insert sample banner
INSERT INTO banners (title, subtitle, image_url, button_text, is_active, sort_order)
VALUES (
  'Summer Collection 2025',
  'Get up to 50% off on all summer wear',
  'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Shop Now',
  true,
  0
);
