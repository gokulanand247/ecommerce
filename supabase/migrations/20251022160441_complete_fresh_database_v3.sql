/*
  # Complete E-commerce Database Setup with Enhanced Features
  
  Complete multi-vendor e-commerce platform with:
  - Multi-vendor support
  - Seller categories and featured products
  - Persistent cart
  - Featured stores management
  - Seller offers
  - Comprehensive order tracking
  
  ## Security
  - RLS enabled on all tables
  - Restrictive authentication-based policies
*/

-- Drop existing tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS todays_deals CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS seller_offers CASCADE;
DROP TABLE IF EXISTS seller_featured_products CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS seller_categories CASCADE;
DROP TABLE IF EXISTS featured_stores CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text,
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Admins
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

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. Sellers
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
  verified_by uuid REFERENCES admins(id),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- 4. Seller Categories
CREATE TABLE seller_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_categories ENABLE ROW LEVEL SECURITY;

-- 5. Featured Stores
CREATE TABLE featured_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id)
);

ALTER TABLE featured_stores ENABLE ROW LEVEL SECURITY;

-- 6. Products
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
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  is_active boolean DEFAULT true,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  seller_category_id uuid REFERENCES seller_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 7. Seller Featured Products
CREATE TABLE seller_featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, product_id)
);

ALTER TABLE seller_featured_products ENABLE ROW LEVEL SECURITY;

-- 8. Seller Offers
CREATE TABLE seller_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_offers ENABLE ROW LEVEL SECURITY;

-- 9. Cart Items
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size text,
  selected_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, selected_size, selected_color)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 10. Addresses
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

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- 11. Coupons
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 12. Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id uuid REFERENCES addresses(id),
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  coupon_id uuid REFERENCES coupons(id),
  status text DEFAULT 'pending',
  payment_id text,
  payment_status text DEFAULT 'pending',
  tracking_number text,
  expected_delivery date,
  seller_id uuid REFERENCES sellers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 13. Order Items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  seller_id uuid NOT NULL REFERENCES sellers(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL,
  mrp numeric NOT NULL,
  selected_size text,
  selected_color text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 14. Order Tracking
CREATE TABLE order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- 15. Coupon Usage
CREATE TABLE coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL,
  used_at timestamptz DEFAULT now()
);

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- 16. Reviews
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

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 17. Today's Deals
CREATE TABLE todays_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todays_deals ENABLE ROW LEVEL SECURITY;

-- 18. Banners
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  button_text text,
  link_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 19. Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (created after all tables exist)
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can create user profile" ON users FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can view own profile" ON admins FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update own profile" ON admins FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Sellers can view own profile" ON sellers FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Sellers can update own profile" ON sellers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can view verified sellers" ON sellers FOR SELECT TO anon, authenticated USING (is_verified = true AND is_active = true);
CREATE POLICY "Anyone can create seller account" ON sellers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can view active seller categories" ON seller_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Sellers can manage own categories" ON seller_categories FOR ALL TO authenticated USING (seller_id = auth.uid());

CREATE POLICY "Anyone can view featured stores" ON featured_stores FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage featured stores" ON featured_stores FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Anyone can view active products" ON products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Sellers can manage own products" ON products FOR ALL TO authenticated USING (seller_id = auth.uid());

CREATE POLICY "Anyone can view seller featured products" ON seller_featured_products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Sellers can manage own featured products" ON seller_featured_products FOR ALL TO authenticated USING (seller_id = auth.uid());

CREATE POLICY "Anyone can view active seller offers" ON seller_offers FOR SELECT TO anon, authenticated USING (is_active = true AND now() BETWEEN valid_from AND valid_until);
CREATE POLICY "Sellers can manage own offers" ON seller_offers FOR ALL TO authenticated USING (seller_id = auth.uid());

CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT TO anon, authenticated USING (is_active = true AND now() BETWEEN valid_from AND valid_until);
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Users can view own orders" ON orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Sellers can view related orders" ON orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND order_items.seller_id = auth.uid()));
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Sellers can view own order items" ON order_items FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Sellers can update own order items" ON order_items FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can view tracking for own orders" ON order_tracking FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "System can insert tracking" ON order_tracking FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own coupon usage" ON coupon_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can record coupon usage" ON coupon_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view active deals" ON todays_deals FOR SELECT TO anon, authenticated USING (is_active = true AND now() BETWEEN valid_from AND valid_until);
CREATE POLICY "Admins can manage deals" ON todays_deals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Anyone can view active banners" ON banners FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON banners FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Sellers can view own notifications" ON notifications FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Sellers can update own notifications" ON notifications FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

-- Indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller_category ON products(seller_category_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_seller_categories_seller ON seller_categories(seller_id);
CREATE INDEX idx_featured_stores_sort ON featured_stores(sort_order);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();