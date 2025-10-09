/*
  # Complete E-commerce Database Schema

  1. New Tables
    - `products` - Product catalog with images, pricing, variants
    - `users` - User profiles linked to auth
    - `addresses` - User delivery addresses
    - `orders` - Order management with status tracking
    - `order_items` - Individual items in orders
    - `order_tracking` - Order status timeline
    - `reviews` - Product reviews and ratings
    - `banners` - Homepage promotional banners

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for products, banners, reviews

  3. Sample Data
    - 20+ products across categories
    - Promotional banners
    - Sample reviews and ratings
*/

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  mrp numeric NOT NULL CHECK (mrp > 0),
  discount integer DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  category text NOT NULL,
  images text[] DEFAULT '{}',
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean DEFAULT true,
  offer_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id uuid NOT NULL REFERENCES addresses(id),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
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
  selected_size text,
  selected_color text
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

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
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

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Products: Public read access for active products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT TO public USING (is_active = true);

-- Users: Users can manage their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can read own addresses" ON addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Orders: Users can manage their own orders
CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Order items: Users can access items from their orders
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT TO authenticated WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Order tracking: Users can view tracking for their orders
CREATE POLICY "Users can read own order tracking" ON order_tracking FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Reviews: Public read, authenticated users can manage their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Banners: Public read access for active banners
CREATE POLICY "Banners are viewable by everyone" ON banners FOR SELECT TO public USING (is_active = true);

-- Insert sample data
-- Sample products
INSERT INTO products (name, description, price, mrp, discount, category, images, sizes, colors, stock_quantity, offer_ends_at) VALUES
('Elegant Banarasi Silk Saree', 'Beautiful handwoven Banarasi silk saree with intricate gold zari work. Perfect for weddings and special occasions.', 2499, 4999, 50, 'sarees', ARRAY['https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg', 'https://images.pexels.com/photos/8839888/pexels-photo-8839888.jpeg'], ARRAY['Free Size'], ARRAY['Red', 'Blue', 'Green', 'Pink'], 25, now() + interval '7 days'),
('Designer Anarkali Suit', 'Stunning designer Anarkali suit with heavy embroidery work. Comes with matching dupatta and churidar.', 1899, 3799, 50, 'ethnic', ARRAY['https://images.pexels.com/photos/8839889/pexels-photo-8839889.jpeg', 'https://images.pexels.com/photos/8839890/pexels-photo-8839890.jpeg'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Navy Blue', 'Maroon', 'Emerald Green'], 30, now() + interval '5 days'),
('Floral Maxi Dress', 'Comfortable and stylish floral print maxi dress perfect for casual outings and summer parties.', 899, 1799, 50, 'western', ARRAY['https://images.pexels.com/photos/8839891/pexels-photo-8839891.jpeg', 'https://images.pexels.com/photos/8839892/pexels-photo-8839892.jpeg'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Floral Pink', 'Floral Blue', 'Floral Yellow'], 40, now() + interval '3 days'),
('Sequin Party Dress', 'Glamorous sequin dress perfect for parties and special events. Features a flattering silhouette.', 1599, 2999, 47, 'party', ARRAY['https://images.pexels.com/photos/8839893/pexels-photo-8839893.jpeg', 'https://images.pexels.com/photos/8839894/pexels-photo-8839894.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Gold', 'Silver', 'Black'], 20, now() + interval '2 days'),
('Cotton Casual Kurti', 'Comfortable cotton kurti perfect for daily wear. Breathable fabric with beautiful prints.', 599, 999, 40, 'casual', ARRAY['https://images.pexels.com/photos/8839895/pexels-photo-8839895.jpeg', 'https://images.pexels.com/photos/8839896/pexels-photo-8839896.jpeg'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Blue', 'Pink', 'Yellow'], 50, now() + interval '10 days'),
('Georgette Saree with Blouse', 'Lightweight georgette saree with designer blouse. Perfect for office parties and casual events.', 1299, 2199, 41, 'sarees', ARRAY['https://images.pexels.com/photos/8839897/pexels-photo-8839897.jpeg', 'https://images.pexels.com/photos/8839898/pexels-photo-8839898.jpeg'], ARRAY['Free Size'], ARRAY['Teal', 'Purple', 'Orange'], 35, now() + interval '6 days'),
('Lehenga Choli Set', 'Traditional lehenga choli with heavy embroidery and mirror work. Includes dupatta.', 3499, 6999, 50, 'ethnic', ARRAY['https://images.pexels.com/photos/8839899/pexels-photo-8839899.jpeg', 'https://images.pexels.com/photos/8839900/pexels-photo-8839900.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Red', 'Pink', 'Blue', 'Green'], 15, now() + interval '4 days'),
('Midi Dress', 'Elegant midi dress suitable for both casual and semi-formal occasions. Comfortable fit.', 1099, 1899, 42, 'western', ARRAY['https://images.pexels.com/photos/8839901/pexels-photo-8839901.jpeg', 'https://images.pexels.com/photos/8839902/pexels-photo-8839902.jpeg'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Burgundy'], 45, now() + interval '8 days'),
('Cocktail Dress', 'Sophisticated cocktail dress perfect for evening events. Features elegant design and premium fabric.', 2199, 3999, 45, 'party', ARRAY['https://images.pexels.com/photos/8839903/pexels-photo-8839903.jpeg', 'https://images.pexels.com/photos/8839904/pexels-photo-8839904.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Red', 'Navy Blue'], 25, now() + interval '1 day'),
('Printed Palazzo Set', 'Comfortable palazzo set with printed top. Perfect for casual wear and summer comfort.', 799, 1399, 43, 'casual', ARRAY['https://images.pexels.com/photos/8839905/pexels-photo-8839905.jpeg', 'https://images.pexels.com/photos/8839906/pexels-photo-8839906.jpeg'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Multi Color', 'Blue Print', 'Pink Print'], 60, now() + interval '12 days'),
('Chiffon Saree', 'Elegant chiffon saree with beautiful border work. Lightweight and comfortable to wear.', 1799, 2999, 40, 'sarees', ARRAY['https://images.pexels.com/photos/8839907/pexels-photo-8839907.jpeg', 'https://images.pexels.com/photos/8839908/pexels-photo-8839908.jpeg'], ARRAY['Free Size'], ARRAY['Peach', 'Mint Green', 'Lavender'], 30, now() + interval '9 days'),
('Salwar Kameez', 'Traditional salwar kameez with dupatta. Comfortable cotton fabric with beautiful embroidery.', 1399, 2299, 39, 'ethnic', ARRAY['https://images.pexels.com/photos/8839909/pexels-photo-8839909.jpeg', 'https://images.pexels.com/photos/8839910/pexels-photo-8839910.jpeg'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Cream', 'Light Blue'], 40, now() + interval '11 days'),
('Jumpsuit', 'Trendy jumpsuit perfect for casual outings. Comfortable fit with stylish design.', 1199, 1999, 40, 'western', ARRAY['https://images.pexels.com/photos/8839911/pexels-photo-8839911.jpeg', 'https://images.pexels.com/photos/8839912/pexels-photo-8839912.jpeg'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Olive Green', 'Denim Blue'], 35, now() + interval '15 days'),
('Evening Gown', 'Luxurious evening gown perfect for formal events. Features elegant draping and premium fabric.', 3999, 7999, 50, 'party', ARRAY['https://images.pexels.com/photos/8839913/pexels-photo-8839913.jpeg', 'https://images.pexels.com/photos/8839914/pexels-photo-8839914.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Wine Red', 'Royal Blue'], 10, now() + interval '3 days'),
('Denim Jacket Dress', 'Stylish denim jacket dress perfect for casual wear. Comfortable and trendy.', 999, 1699, 41, 'casual', ARRAY['https://images.pexels.com/photos/8839915/pexels-photo-8839915.jpeg', 'https://images.pexels.com/photos/8839916/pexels-photo-8839916.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Light Blue', 'Dark Blue', 'Black'], 45, now() + interval '7 days'),
('Silk Saree', 'Pure silk saree with traditional motifs. Perfect for festivals and special occasions.', 2999, 4999, 40, 'sarees', ARRAY['https://images.pexels.com/photos/8839917/pexels-photo-8839917.jpeg', 'https://images.pexels.com/photos/8839918/pexels-photo-8839918.jpeg'], ARRAY['Free Size'], ARRAY['Deep Red', 'Golden Yellow', 'Royal Purple'], 20, now() + interval '5 days'),
('Indo-Western Dress', 'Fusion indo-western dress combining traditional and modern elements. Unique and stylish.', 1699, 2799, 39, 'ethnic', ARRAY['https://images.pexels.com/photos/8839919/pexels-photo-8839919.jpeg', 'https://images.pexels.com/photos/8839920/pexels-photo-8839920.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Coral', 'Turquoise', 'Magenta'], 25, now() + interval '6 days'),
('A-Line Dress', 'Classic A-line dress suitable for various occasions. Flattering fit and comfortable wear.', 1299, 2199, 41, 'western', ARRAY['https://images.pexels.com/photos/8839921/pexels-photo-8839921.jpeg', 'https://images.pexels.com/photos/8839922/pexels-photo-8839922.jpeg'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Navy Blue', 'Maroon', 'Forest Green'], 40, now() + interval '10 days'),
('Party Crop Top Set', 'Trendy crop top and skirt set perfect for parties. Modern design with comfortable fit.', 1499, 2499, 40, 'party', ARRAY['https://images.pexels.com/photos/8839923/pexels-photo-8839923.jpeg', 'https://images.pexels.com/photos/8839924/pexels-photo-8839924.jpeg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['Rose Gold', 'Silver', 'Copper'], 30, now() + interval '4 days'),
('Casual T-Shirt Dress', 'Comfortable t-shirt dress perfect for everyday wear. Soft fabric and relaxed fit.', 699, 1199, 42, 'casual', ARRAY['https://images.pexels.com/photos/8839925/pexels-photo-8839925.jpeg', 'https://images.pexels.com/photos/8839926/pexels-photo-8839926.jpeg'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Gray', 'Pink', 'Blue'], 55, now() + interval '14 days');

-- Sample banners
INSERT INTO banners (title, subtitle, image_url, button_text, link_url, sort_order) VALUES
('Summer Sale', 'Up to 50% off on all dresses', 'https://images.pexels.com/photos/8839927/pexels-photo-8839927.jpeg', 'Shop Now', '/products', 1),
('New Arrivals', 'Discover the latest fashion trends', 'https://images.pexels.com/photos/8839928/pexels-photo-8839928.jpeg', 'Explore', '/products', 2),
('Ethnic Collection', 'Traditional wear for special occasions', 'https://images.pexels.com/photos/8839929/pexels-photo-8839929.jpeg', 'View Collection', '/products?category=ethnic', 3),
('Party Wear', 'Glamorous dresses for your special nights', 'https://images.pexels.com/photos/8839930/pexels-photo-8839930.jpeg', 'Shop Party Wear', '/products?category=party', 4),
('Free Delivery', 'Free shipping on orders above ₹999', 'https://images.pexels.com/photos/8839931/pexels-photo-8839931.jpeg', 'Start Shopping', '/products', 5);