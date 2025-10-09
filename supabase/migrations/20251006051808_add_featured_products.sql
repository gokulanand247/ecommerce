/*
  # Add Featured Products System

  ## New Table
  - `featured_products` - Links to products that should be featured
    - `id` - UUID primary key
    - `product_id` - Reference to products table
    - `sort_order` - For ordering featured products
    - `is_active` - To enable/disable featured products
    - `created_at` - Timestamp
  
  ## Security
  - Enable RLS
  - Public read access for active featured products
  
  ## Sample Data
  - Add first 6 products as featured
*/

-- Create featured_products table
CREATE TABLE IF NOT EXISTS featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_featured_products_active ON featured_products(is_active, sort_order);

-- Enable RLS
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

-- RLS Policy - public can view active featured products
CREATE POLICY "Featured products are viewable by everyone" 
  ON featured_products FOR SELECT 
  TO public 
  USING (is_active = true);

-- Insert featured products (first 6 products with highest ratings/reviews)
INSERT INTO featured_products (product_id, sort_order, is_active)
SELECT 
  p.id,
  ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as sort_order,
  true
FROM products p
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 6
ON CONFLICT (product_id) DO NOTHING;

-- Create a view to easily fetch featured products with full details
CREATE OR REPLACE VIEW featured_products_view AS
SELECT 
  fp.id as featured_id,
  fp.sort_order,
  p.*
FROM featured_products fp
JOIN products p ON fp.product_id = p.id
WHERE fp.is_active = true AND p.is_active = true
ORDER BY fp.sort_order;

-- Grant access to the view
GRANT SELECT ON featured_products_view TO authenticated, anon;
