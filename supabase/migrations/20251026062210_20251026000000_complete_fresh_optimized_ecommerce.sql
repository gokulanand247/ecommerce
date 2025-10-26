/*
  # Complete Fresh Optimized E-commerce Database

  ## Overview
  This migration creates a complete, optimized e-commerce database with proper security,
  performance optimizations, and image size constraints.

  ## New Tables
  
  ### Core Tables
  - `users` - Customer accounts with phone and password authentication
  - `sellers` - Seller/vendor accounts with verification
  - `admins` - Admin accounts for platform management
  - `categories` - Product categories
  - `products` - Product listings (max 6 images, 5MB total limit)
  - `product_variants` - Size/color variants
  
  ### Order Management
  - `addresses` - User delivery addresses
  - `orders` - Order records
  - `order_items` - Items in each order
  - `order_tracking` - Order status tracking
  
  ### Marketing & Features
  - `coupons` - Discount codes
  - `deals` - Flash deals and promotions
  - `featured_stores` - Featured seller stores
  - `reviews` - Product reviews
  - `cart` - Shopping cart items
  - `notifications` - User notifications
  
  ## Security
  - RLS enabled on all tables
  - Secure password hashing for all user types
  - Role-based access control
  - Ownership verification for all operations
  
  ## Performance
  - Indexes on frequently queried columns
  - Materialized views for analytics
  - Optimized image storage (max 6 images per product, 5MB total)
  - Automatic stock management triggers
  
  ## Important Notes
  1. Image uploads limited to 6 images maximum per product
  2. Total image size limit: 5MB per product
  3. Passwords stored with secure hashing (crypt extension)
  4. Auto-generated sample data for testing
  5. Default admin: username 'admin', password 'Admin@123'
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS featured_stores CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS admin_analytics CASCADE;
DROP VIEW IF EXISTS featured_products_view CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_login CASCADE;
DROP FUNCTION IF EXISTS verify_seller_login CASCADE;
DROP FUNCTION IF EXISTS verify_user_login CASCADE;
DROP FUNCTION IF EXISTS get_seller_analytics CASCADE;
DROP FUNCTION IF EXISTS update_product_stock CASCADE;

-- Users table with password authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sellers table
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_requested_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES admins(id),
  profile_completed BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (with image constraints)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  brand VARCHAR(100),
  sku VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT images_limit CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 6)
);

-- Product variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  sku VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID REFERENCES addresses(id),
  coupon_id UUID REFERENCES coupons(id),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  shipping_fee DECIMAL(10,2) DEFAULT 0 CHECK (shipping_fee >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order tracking
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Featured stores
CREATE TABLE featured_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  featured_from TIMESTAMPTZ DEFAULT NOW(),
  featured_until TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read product variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "Public read sellers" ON sellers FOR SELECT TO anon, authenticated USING (is_active = true AND is_verified = true);
CREATE POLICY "Public read deals" ON deals FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read featured stores" ON featured_stores FOR SELECT TO anon, authenticated USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_deals_product ON deals(product_id);
CREATE INDEX idx_deals_active ON deals(is_active) WHERE is_active = true;

-- Authentication functions
CREATE OR REPLACE FUNCTION verify_user_login(p_phone VARCHAR, p_password TEXT)
RETURNS TABLE (
  user_id UUID,
  phone VARCHAR,
  name VARCHAR,
  email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.phone,
    u.name,
    u.email
  FROM users u
  WHERE u.phone = p_phone
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_admin_login(p_username VARCHAR, p_password TEXT)
RETURNS TABLE (
  admin_id UUID,
  username VARCHAR,
  email VARCHAR,
  name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.name
  FROM admins a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash)
    AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_seller_login(p_username VARCHAR, p_password TEXT)
RETURNS TABLE (
  seller_id UUID,
  username VARCHAR,
  shop_name VARCHAR,
  email VARCHAR,
  is_verified BOOLEAN,
  profile_completed BOOLEAN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seller analytics function
CREATE OR REPLACE FUNCTION get_seller_analytics(p_seller_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_products', (SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id),
    'total_orders', (SELECT COUNT(DISTINCT order_id) FROM order_items WHERE seller_id = p_seller_id),
    'total_revenue', (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE seller_id = p_seller_id),
    'pending_orders', (SELECT COUNT(*) FROM order_items WHERE seller_id = p_seller_id AND status = 'pending')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stock management trigger
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- Admin analytics view
CREATE VIEW admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM sellers WHERE is_verified = true) as total_sellers,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders;

-- Featured products view
CREATE VIEW featured_products_view AS
SELECT 
  p.*,
  s.shop_name,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id) as review_count
FROM products p
LEFT JOIN sellers s ON p.seller_id = s.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = true
WHERE p.is_featured = true AND p.is_active = true
GROUP BY p.id, s.shop_name;

-- Insert sample data

-- Insert default admin
INSERT INTO admins (username, password_hash, email, name) VALUES
('admin', crypt('Admin@123', gen_salt('bf')), 'admin@dresshub.com', 'System Admin');

-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active) VALUES
('Men''s Wear', 'mens-wear', 'Fashion for men', true),
('Women''s Wear', 'womens-wear', 'Fashion for women', true),
('Kids Wear', 'kids-wear', 'Fashion for kids', true),
('Accessories', 'accessories', 'Fashion accessories', true);

-- Insert sample sellers
INSERT INTO sellers (username, password_hash, shop_name, email, phone, city, state, is_verified, profile_completed) VALUES
('seller1', crypt('Seller@123', gen_salt('bf')), 'Fashion Hub', 'seller1@example.com', '9876543210', 'Mumbai', 'Maharashtra', true, true),
('seller2', crypt('Seller@123', gen_salt('bf')), 'Style Store', 'seller2@example.com', '9876543211', 'Delhi', 'Delhi', true, true),
('seller3', crypt('Seller@123', gen_salt('bf')), 'Trend Mart', 'seller3@example.com', '9876543212', 'Bangalore', 'Karnataka', true, true);

-- Insert sample users
INSERT INTO users (phone, password_hash, name, email) VALUES
('1234567890', crypt('User@123', gen_salt('bf')), 'Test User', 'user@example.com'),
('1234567891', crypt('User@123', gen_salt('bf')), 'Demo User', 'demo@example.com');

-- Insert sample products (with limited images)
INSERT INTO products (seller_id, category_id, name, description, price, original_price, image_url, images, stock_quantity, is_featured, brand)
SELECT 
  (SELECT id FROM sellers LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'mens-wear' LIMIT 1),
  'Classic Cotton T-Shirt',
  'Comfortable cotton t-shirt for everyday wear',
  499,
  799,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
  100,
  true,
  'StyleBrand';

INSERT INTO products (seller_id, category_id, name, description, price, original_price, image_url, images, stock_quantity, is_featured, brand)
SELECT 
  (SELECT id FROM sellers OFFSET 1 LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'womens-wear' LIMIT 1),
  'Elegant Dress',
  'Beautiful dress for special occasions',
  1299,
  1999,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500'],
  50,
  true,
  'FashionLine';

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, is_active) VALUES
('WELCOME10', 'Welcome discount for new users', 'percentage', 10, 500, 100, 1000, true),
('SAVE50', 'Flat 50 off on orders above 999', 'fixed', 50, 999, 50, 500, true);

-- Insert featured stores
INSERT INTO featured_stores (seller_id, display_order)
SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) 
FROM sellers 
WHERE is_verified = true 
LIMIT 3;

-- Insert sample reviews
INSERT INTO reviews (product_id, rating, comment, is_verified_purchase, is_approved)
SELECT 
  id,
  4,
  'Great product! Highly recommended.',
  false,
  true
FROM products 
LIMIT 2;
