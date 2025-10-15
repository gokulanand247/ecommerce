/*
  # Fix Stock Management Issues

  This migration fixes all stock-related problems:
  1. Ensures stock never falls back to 0 when creating/updating products
  2. Properly syncs stock and stock_quantity fields
  3. Adds stock decrease functionality on order creation
  4. Prevents stock from going negative
*/

-- Drop and recreate the sync trigger with improved logic
DROP TRIGGER IF EXISTS sync_product_data_trigger ON products;
DROP FUNCTION IF EXISTS sync_product_images();

CREATE OR REPLACE FUNCTION sync_product_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync images
  IF NEW.image_url IS NOT NULL AND (NEW.images IS NULL OR NEW.images = '[]'::jsonb) THEN
    NEW.images := jsonb_build_array(NEW.image_url);
  END IF;

  IF (NEW.images IS NOT NULL AND NEW.images != '[]'::jsonb) AND NEW.image_url IS NULL THEN
    NEW.image_url := NEW.images->>0;
  END IF;

  -- Stock sync logic - CRITICAL FIX
  -- When inserting new product
  IF TG_OP = 'INSERT' THEN
    -- If stock_quantity is provided, use it
    IF NEW.stock_quantity IS NOT NULL AND NEW.stock_quantity >= 0 THEN
      NEW.stock := NEW.stock_quantity;
    -- If stock is provided, use it
    ELSIF NEW.stock IS NOT NULL AND NEW.stock >= 0 THEN
      NEW.stock_quantity := NEW.stock;
    -- Default to 0 only if both are NULL
    ELSE
      NEW.stock := 0;
      NEW.stock_quantity := 0;
    END IF;
  END IF;

  -- When updating existing product
  IF TG_OP = 'UPDATE' THEN
    -- If stock_quantity changed, sync to stock
    IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
      NEW.stock := NEW.stock_quantity;
    -- If stock changed, sync to stock_quantity
    ELSIF NEW.stock IS DISTINCT FROM OLD.stock THEN
      NEW.stock_quantity := NEW.stock;
    END IF;

    -- Ensure values never become NULL
    IF NEW.stock IS NULL THEN
      NEW.stock := COALESCE(OLD.stock, 0);
    END IF;
    IF NEW.stock_quantity IS NULL THEN
      NEW.stock_quantity := COALESCE(OLD.stock_quantity, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_product_data_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_data();

-- Function to decrease stock when order is created
CREATE OR REPLACE FUNCTION decrease_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  product_id_val UUID;
  quantity_val INTEGER;
  current_stock INTEGER;
BEGIN
  -- Only process on INSERT and when status is 'pending' or 'confirmed'
  IF TG_OP = 'INSERT' AND NEW.status IN ('pending', 'confirmed') THEN
    -- Loop through each item in the order
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'product_id')::UUID;
      quantity_val := (item->>'quantity')::INTEGER;

      -- Get current stock
      SELECT stock INTO current_stock
      FROM products
      WHERE id = product_id_val;

      -- Decrease stock (but don't go below 0)
      UPDATE products
      SET stock = GREATEST(0, stock - quantity_val),
          stock_quantity = GREATEST(0, stock_quantity - quantity_val)
      WHERE id = product_id_val;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock decrease on order creation
DROP TRIGGER IF EXISTS decrease_stock_on_order_trigger ON orders;
CREATE TRIGGER decrease_stock_on_order_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrease_stock_on_order();

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  product_id_val UUID;
  quantity_val INTEGER;
BEGIN
  -- Only process when status changes to 'cancelled'
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Loop through each item in the order
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'product_id')::UUID;
      quantity_val := (item->>'quantity')::INTEGER;

      -- Restore stock
      UPDATE products
      SET stock = stock + quantity_val,
          stock_quantity = stock_quantity + quantity_val
      WHERE id = product_id_val;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock restoration on order cancellation
DROP TRIGGER IF EXISTS restore_stock_on_cancel_trigger ON orders;
CREATE TRIGGER restore_stock_on_cancel_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_cancel();

-- Fix any existing products with NULL stock values
UPDATE products
SET stock = COALESCE(stock_quantity, 0),
    stock_quantity = COALESCE(stock_quantity, 0)
WHERE stock IS NULL OR stock_quantity IS NULL;
