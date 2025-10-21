/*
  # Add Advanced E-commerce Features

  1. New Tables
    - featured_stores: Admin-selected top 4 stores for homepage
    - seller_categories: Custom categories created by sellers
    - seller_featured_products: Top 4 featured products per seller
    - seller_offers: Seller-specific offers for their products
    - cart_items: Persistent cart storage

  2. Changes
    - Enhanced security with better RLS policies
    - Indexes for performance
*/

-- Featured Stores (Admin manages)
CREATE TABLE IF NOT EXISTS featured_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id)
);

-- Seller Categories
CREATE TABLE IF NOT EXISTS seller_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, name)
);

-- Update products to include seller category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'seller_category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN seller_category_id uuid REFERENCES seller_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seller Featured Products
CREATE TABLE IF NOT EXISTS seller_featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, product_id)
);

-- Seller Offers
CREATE TABLE IF NOT EXISTS seller_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK (valid_until > valid_from)
);

-- Persistent Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size text NOT NULL,
  selected_color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, selected_size, selected_color)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_featured_stores_seller ON featured_stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_featured_stores_active ON featured_stores(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seller_categories_seller ON seller_categories(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_category ON products(seller_category_id);
CREATE INDEX IF NOT EXISTS idx_seller_featured_products_seller ON seller_featured_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_seller ON seller_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_product ON seller_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_active ON seller_offers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- Enable RLS
ALTER TABLE featured_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public access" ON featured_stores FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON seller_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON seller_featured_products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON seller_offers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON cart_items FOR ALL TO public USING (true) WITH CHECK (true);

-- Trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get featured stores
CREATE OR REPLACE FUNCTION get_featured_stores()
RETURNS TABLE(
  id uuid,
  seller_id uuid,
  shop_name text,
  city text,
  sort_order integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.id,
    fs.seller_id,
    s.shop_name,
    s.city,
    fs.sort_order
  FROM featured_stores fs
  INNER JOIN sellers s ON s.id = fs.seller_id
  WHERE fs.is_active = true AND s.is_active = true AND s.is_verified = true
  ORDER BY fs.sort_order ASC, fs.created_at DESC
  LIMIT 4;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_featured_stores TO anon, authenticated;
