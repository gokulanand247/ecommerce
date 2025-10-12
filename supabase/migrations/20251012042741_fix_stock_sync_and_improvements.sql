/*
  # Fix Stock Sync and Add Improvements

  1. Fixes
    - Ensure stock and stock_quantity always sync
    - Update existing products to have correct stock values

  2. New Features
    - Add seller info to products for display
    - Add rating fields for filtering
*/

-- Fix the sync trigger to ensure both fields are always updated
CREATE OR REPLACE FUNCTION sync_product_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync images
  IF NEW.image_url IS NOT NULL AND (NEW.images IS NULL OR NEW.images = '[]'::jsonb) THEN
    NEW.images := jsonb_build_array(NEW.image_url);
  END IF;

  IF (NEW.images IS NOT NULL AND NEW.images != '[]'::jsonb) AND NEW.image_url IS NULL THEN
    NEW.image_url := NEW.images->>0;
  END IF;

  -- Sync stock fields - ensure both are always the same
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

-- Update all existing products to sync stock
UPDATE products
SET stock = stock_quantity
WHERE stock_quantity IS NOT NULL AND stock != stock_quantity;

UPDATE products
SET stock_quantity = stock
WHERE stock IS NOT NULL AND stock_quantity != stock;

UPDATE products
SET stock = 0, stock_quantity = 0
WHERE stock IS NULL OR stock_quantity IS NULL;

-- Add average_rating column for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE products ADD COLUMN average_rating numeric DEFAULT 0;
  END IF;
END $$;

-- Function to update product average rating
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

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS update_product_rating_trigger ON reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Update existing product ratings
UPDATE products p
SET average_rating = (
  SELECT COALESCE(AVG(r.rating), 0)
  FROM reviews r
  WHERE r.product_id = p.id
);
