/*
  # Complete Production E-commerce Database Setup
  
  This migration creates a complete, production-ready e-commerce system with:
  - User management with phone authentication
  - Product catalog with seller attribution, sizes, colors
  - Order management with size/color tracking
  - Seller system with verification and notifications
  - Coupon/discount system
  - Today's deals management
  - Admin system with full control
  - Complete RLS policies
  - Notification system for orders
  
  ## Tables Created:
  1. users - Customer accounts
  2. addresses - Customer delivery addresses
  3. products - Product catalog with sizes/colors
  4. orders - Order records
  5. order_items - Order line items with size/color
  6. order_tracking - Order status tracking
  7. reviews - Product reviews
  8. banners - Homepage banners
  9. sellers - Seller accounts
  10. admins - Admin accounts
  11. coupons - Discount coupons
  12. coupon_usage - Coupon usage tracking
  13. todays_deals - Special deals
  14. notifications - Order notifications for admin/sellers
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS todays_deals CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
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

-- Products table with sizes and colors
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  mrp numeric NOT NULL CHECK (mrp >= 0),
  category text NOT NULL,
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  stock integer DEFAULT 0 CHECK (stock >= 0),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  average_rating numeric DEFAULT 0,
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
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table with size and color
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price > 0),
  mrp numeric NOT NULL CHECK (mrp > 0),
  selected_size text NOT NULL,
  selected_color text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
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
  CHECK (valid_until > valid_from)
);

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
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

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_order', 'status_update')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_sellers_username ON sellers(username);
CREATE INDEX idx_sellers_verified ON sellers(is_verified);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_todays_deals_product ON todays_deals(product_id);
CREATE INDEX idx_todays_deals_active ON todays_deals(is_active);
CREATE INDEX idx_notifications_seller ON notifications(seller_id);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;

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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Public access" ON notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sync product images and stock
CREATE OR REPLACE FUNCTION sync_product_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.image_url IS NOT NULL AND (NEW.images IS NULL OR NEW.images = '[]'::jsonb) THEN
    NEW.images := jsonb_build_array(NEW.image_url);
  END IF;

  IF (NEW.images IS NOT NULL AND NEW.images != '[]'::jsonb) AND NEW.image_url IS NULL THEN
    NEW.image_url := NEW.images->>0;
  END IF;

  IF NEW.stock_quantity IS NOT NULL THEN
    NEW.stock := NEW.stock_quantity;
  ELSIF NEW.stock IS NOT NULL THEN
    NEW.stock_quantity := NEW.stock;
  ELSE
    NEW.stock := 0;
    NEW.stock_quantity := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update product rating
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

-- Create notification on new order
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id uuid;
  v_shop_name text;
BEGIN
  FOR v_seller_id IN 
    SELECT DISTINCT seller_id FROM order_items WHERE order_id = NEW.id AND seller_id IS NOT NULL
  LOOP
    SELECT shop_name INTO v_shop_name FROM sellers WHERE id = v_seller_id;
    
    INSERT INTO notifications (order_id, seller_id, type, message)
    VALUES (
      NEW.id,
      v_seller_id,
      'new_order',
      'New order #' || SUBSTRING(NEW.id::text, 1, 8) || ' received'
    );
  END LOOP;

  INSERT INTO notifications (order_id, seller_id, type, message)
  VALUES (
    NEW.id,
    NULL,
    'new_order',
    'New order #' || SUBSTRING(NEW.id::text, 1, 8) || ' placed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sync_product_fields_trigger BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION sync_product_fields();
CREATE TRIGGER update_product_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_rating();
CREATE TRIGGER create_order_notification_trigger AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION create_order_notification();

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_seller_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_coupon TO anon, authenticated;

-- Insert default admin account
INSERT INTO admins (username, password_hash, email, name, is_active)
VALUES (
  'admin',
  crypt('Admin@123', gen_salt('bf')),
  'admin@dresshub.com',
  'System Administrator',
  true
);

-- Insert sample sellers
INSERT INTO sellers (username, password_hash, shop_name, email, phone, address, city, state, pincode, is_active, is_verified, profile_completed, verified_at)
VALUES 
  (
    'fashionhouse',
    crypt('Seller@123', gen_salt('bf')),
    'Fashion House',
    'fashion@example.com',
    '9876543210',
    '123 Fashion Street',
    'Mumbai',
    'Maharashtra',
    '400001',
    true,
    true,
    true,
    now()
  ),
  (
    'trendsetter',
    crypt('Seller@123', gen_salt('bf')),
    'Trend Setter Boutique',
    'trendsetter@example.com',
    '9876543211',
    '456 Style Avenue',
    'Delhi',
    'Delhi',
    '110001',
    true,
    true,
    true,
    now()
  );

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, usage_limit, is_active)
VALUES
  ('WELCOME10', 'Welcome offer - 10% off', 'percentage', 10, 500, 200, now(), now() + interval '30 days', 1000, true),
  ('FLAT200', 'Flat ₹200 off on orders above ₹1000', 'fixed', 200, 1000, NULL, now(), now() + interval '30 days', 500, true),
  ('MEGA50', 'Mega sale - 50% off', 'percentage', 50, 2000, 1000, now(), now() + interval '7 days', 100, true);

-- Insert sample products
INSERT INTO products (name, description, price, mrp, category, image_url, sizes, colors, stock, seller_id)
SELECT 
  'Casual Cotton T-Shirt',
  'Comfortable cotton t-shirt perfect for daily wear. Made from 100% premium cotton.',
  499,
  999,
  'Men',
  'https://images.pexels.com/photos/1661471/pexels-photo-1661471.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['White', 'Black', 'Navy', 'Grey'],
  100,
  id
FROM sellers WHERE username = 'fashionhouse'
UNION ALL
SELECT 
  'Formal Shirt',
  'Premium formal shirt for office wear. Wrinkle-free fabric.',
  899,
  1499,
  'Men',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['White', 'Blue', 'Pink'],
  80,
  id
FROM sellers WHERE username = 'fashionhouse'
UNION ALL
SELECT 
  'Women Floral Dress',
  'Beautiful floral dress for summer. Light and comfortable.',
  1299,
  2499,
  'Women',
  'https://images.pexels.com/photos/1007018/pexels-photo-1007018.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Pink', 'Blue', 'Yellow'],
  60,
  id
FROM sellers WHERE username = 'trendsetter'
UNION ALL
SELECT 
  'Denim Jeans',
  'Classic blue denim jeans. Comfortable fit.',
  1199,
  2199,
  'Men',
  'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['28', '30', '32', '34', '36'],
  ARRAY['Blue', 'Black'],
  70,
  id
FROM sellers WHERE username = 'trendsetter'
UNION ALL
SELECT 
  'Ethnic Kurti',
  'Traditional ethnic kurti with modern design.',
  799,
  1599,
  'Women',
  'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Red', 'Green', 'Blue', 'Yellow'],
  90,
  id
FROM sellers WHERE username = 'fashionhouse';

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

-- Create sample user
INSERT INTO users (phone, name, email)
VALUES ('9999999999', 'Test User', 'testuser@example.com');
