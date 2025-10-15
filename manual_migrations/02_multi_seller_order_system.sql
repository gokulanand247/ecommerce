/*
  # Multi-Seller Order System

  This migration implements the multi-seller order system:
  1. Creates order_items table to track individual items with seller info
  2. Updates orders table to support multi-seller tracking
  3. Adds functions to split orders by seller
  4. Maintains order totals and status tracking
*/

-- Create order_items table to track individual items per seller
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID REFERENCES sellers(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Sellers can view their order items
CREATE POLICY "Sellers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = order_items.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

-- Sellers can update status of their order items
CREATE POLICY "Sellers can update their order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = order_items.seller_id
      AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = order_items.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

-- Admins can do everything with order_items
CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to create order items from order
CREATE OR REPLACE FUNCTION create_order_items_from_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  product_seller_id UUID;
  product_price NUMERIC;
BEGIN
  -- Only process on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Loop through each item in the order
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      -- Get seller_id and price from product
      SELECT seller_id, COALESCE(sale_price, price)
      INTO product_seller_id, product_price
      FROM products
      WHERE id = (item->>'product_id')::UUID;

      -- Insert order item
      INSERT INTO order_items (
        order_id,
        product_id,
        seller_id,
        quantity,
        price,
        subtotal,
        status
      ) VALUES (
        NEW.id,
        (item->>'product_id')::UUID,
        product_seller_id,
        (item->>'quantity')::INTEGER,
        product_price,
        product_price * (item->>'quantity')::INTEGER,
        NEW.status
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create order items
DROP TRIGGER IF EXISTS create_order_items_trigger ON orders;
CREATE TRIGGER create_order_items_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_items_from_order();

-- Function to sync order item status with main order
CREATE OR REPLACE FUNCTION sync_order_status()
RETURNS TRIGGER AS $$
DECLARE
  all_statuses TEXT[];
  main_status TEXT;
BEGIN
  -- Get all unique statuses for this order
  SELECT ARRAY_AGG(DISTINCT status)
  INTO all_statuses
  FROM order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Determine main order status based on item statuses
  IF 'cancelled' = ANY(all_statuses) AND array_length(all_statuses, 1) = 1 THEN
    main_status := 'cancelled';
  ELSIF 'delivered' = ANY(all_statuses) AND array_length(all_statuses, 1) = 1 THEN
    main_status := 'delivered';
  ELSIF 'shipped' = ANY(all_statuses) THEN
    main_status := 'shipped';
  ELSIF 'processing' = ANY(all_statuses) THEN
    main_status := 'processing';
  ELSIF 'confirmed' = ANY(all_statuses) THEN
    main_status := 'confirmed';
  ELSE
    main_status := 'pending';
  END IF;

  -- Update main order status
  UPDATE orders
  SET status = main_status,
      updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync order status when items change
DROP TRIGGER IF EXISTS sync_order_status_trigger ON order_items;
CREATE TRIGGER sync_order_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status();

-- Function to update order_items timestamp
CREATE OR REPLACE FUNCTION update_order_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order_items timestamp
DROP TRIGGER IF EXISTS update_order_items_timestamp_trigger ON order_items;
CREATE TRIGGER update_order_items_timestamp_trigger
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_items_timestamp();

-- Backfill existing orders with order_items
DO $$
DECLARE
  order_record RECORD;
  item JSONB;
  product_seller_id UUID;
  product_price NUMERIC;
BEGIN
  -- Loop through all existing orders that don't have order_items
  FOR order_record IN
    SELECT o.* FROM orders o
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
    )
  LOOP
    -- Loop through each item in the order
    FOR item IN SELECT * FROM jsonb_array_elements(order_record.items)
    LOOP
      -- Get seller_id and price from product
      SELECT seller_id, COALESCE(sale_price, price)
      INTO product_seller_id, product_price
      FROM products
      WHERE id = (item->>'product_id')::UUID;

      -- Insert order item
      INSERT INTO order_items (
        order_id,
        product_id,
        seller_id,
        quantity,
        price,
        subtotal,
        status,
        created_at
      ) VALUES (
        order_record.id,
        (item->>'product_id')::UUID,
        product_seller_id,
        (item->>'quantity')::INTEGER,
        product_price,
        product_price * (item->>'quantity')::INTEGER,
        order_record.status,
        order_record.created_at
      );
    END LOOP;
  END LOOP;
END $$;
