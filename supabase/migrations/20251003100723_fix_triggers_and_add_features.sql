/*
  # Fix Database Triggers and Add New Features

  ## Problem Fix
  - Drop and recreate all triggers to avoid "already exists" error
  - The issue was caused by multiple migrations creating the same triggers

  ## New Features
  
  1. Promo Codes System
    - `promo_codes` table for discount management
    - Fields: code, discount_type (percentage/fixed), discount_value, validity dates, usage limits
    - RLS policies for public read access
  
  2. Today's Deals
    - `todays_deals` table for time-limited special offers
    - Links to products with timer support
    - Fields: product_id, deal_price, starts_at, ends_at
    - Automatic visibility control based on time
  
  3. Enhanced Order Items
    - Add `mrp` field to order_items for price comparison in cart
    - Shows both striked-out MRP and discounted price
  
  4. User Authentication Updates
    - Change from phone-based to email/password authentication
    - Add password reset token fields
    - Keep phone as optional field
  
  ## Security
  - All tables have RLS enabled
  - Proper policies for authenticated and public access
*/

-- Drop all existing triggers to fix the error
DROP TRIGGER IF EXISTS update_products_updated_at ON products CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders CASCADE;

-- Recreate the trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate triggers
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update users table for email/password auth
DO $$
BEGIN
  -- Make phone optional and add email as required
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
  
  -- Add password reset fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'reset_token'
  ) THEN
    ALTER TABLE users ADD COLUMN reset_token text;
    ALTER TABLE users ADD COLUMN reset_token_expires_at timestamptz;
  END IF;
END $$;

-- Add MRP to order_items for price comparison
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'mrp'
  ) THEN
    ALTER TABLE order_items ADD COLUMN mrp numeric CHECK (mrp > 0);
  END IF;
END $$;

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount numeric CHECK (max_discount_amount > 0),
  usage_limit integer CHECK (usage_limit > 0),
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create today's deals table
CREATE TABLE IF NOT EXISTS todays_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  deal_price numeric NOT NULL CHECK (deal_price > 0),
  original_price numeric NOT NULL CHECK (original_price > 0),
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_deal_dates CHECK (ends_at > starts_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_todays_deals_product ON todays_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_todays_deals_active ON todays_deals(is_active, starts_at, ends_at);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Promo codes are viewable by everyone" 
  ON promo_codes FOR SELECT 
  TO public 
  USING (is_active = true AND now() BETWEEN valid_from AND valid_until);

-- RLS Policies for today's deals
CREATE POLICY "Today's deals are viewable by everyone" 
  ON todays_deals FOR SELECT 
  TO public 
  USING (is_active = true AND now() BETWEEN starts_at AND ends_at);

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until) VALUES
('WELCOME10', 'Welcome discount - 10% off on first order', 'percentage', 10, 999, 500, 1000, now() + interval '30 days'),
('SAVE20', 'Flat 20% off on orders above ₹1999', 'percentage', 20, 1999, 1000, 500, now() + interval '15 days'),
('FLAT500', 'Flat ₹500 off on orders above ₹2999', 'fixed', 500, 2999, null, 200, now() + interval '20 days'),
('FESTIVE30', 'Festive Sale - 30% off', 'percentage', 30, 1499, 1500, 300, now() + interval '10 days')
ON CONFLICT (code) DO NOTHING;

-- Insert today's deals (linking to first 4 products)
INSERT INTO todays_deals (product_id, deal_price, original_price, ends_at)
SELECT 
  id,
  price * 0.7,
  mrp,
  now() + interval '24 hours'
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 4
ON CONFLICT DO NOTHING;
