/*
  # Add Automatic Order Tracking

  ## Features
  - Automatically create initial tracking entry when order is created
  - Automatically update tracking when order status changes
  - Generate tracking numbers for shipped orders
  - Set expected delivery dates
  
  ## Security
  - All triggers use security definer for proper access
*/

-- Function to create initial order tracking
CREATE OR REPLACE FUNCTION create_initial_order_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_tracking (order_id, status, message, created_at)
  VALUES (
    NEW.id,
    'pending',
    'Order has been placed successfully. Payment verification in progress.',
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update order tracking when status changes
CREATE OR REPLACE FUNCTION update_order_tracking_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  tracking_message text;
  tracking_location text;
BEGIN
  -- Only create tracking if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Generate appropriate message based on status
    CASE NEW.status
      WHEN 'confirmed' THEN
        tracking_message := 'Order confirmed and being prepared for shipment.';
        tracking_location := 'Warehouse';
      WHEN 'processing' THEN
        tracking_message := 'Order is being processed and packed.';
        tracking_location := 'Warehouse';
      WHEN 'shipped' THEN
        tracking_message := 'Order has been shipped.';
        tracking_location := 'In Transit';
        -- Generate tracking number if not exists
        IF NEW.tracking_number IS NULL THEN
          NEW.tracking_number := 'TRK' || LPAD((random() * 1000000)::integer::text, 10, '0');
        END IF;
        -- Set expected delivery date (5-7 days from now)
        IF NEW.expected_delivery IS NULL THEN
          NEW.expected_delivery := (CURRENT_DATE + interval '5 days')::date;
        END IF;
      WHEN 'out_for_delivery' THEN
        tracking_message := 'Order is out for delivery. Will be delivered today.';
        tracking_location := 'Local Delivery Hub';
      WHEN 'delivered' THEN
        tracking_message := 'Order has been delivered successfully.';
        tracking_location := 'Delivered';
      WHEN 'cancelled' THEN
        tracking_message := 'Order has been cancelled.';
        tracking_location := NULL;
      WHEN 'returned' THEN
        tracking_message := 'Order return has been initiated.';
        tracking_location := 'Return in Progress';
      ELSE
        tracking_message := 'Order status updated.';
        tracking_location := NULL;
    END CASE;

    -- Insert tracking record
    INSERT INTO order_tracking (order_id, status, message, location, created_at)
    VALUES (NEW.id, NEW.status, tracking_message, tracking_location, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS create_order_tracking_trigger ON orders;
DROP TRIGGER IF EXISTS update_order_tracking_trigger ON orders;

-- Create trigger for initial tracking
CREATE TRIGGER create_order_tracking_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_order_tracking();

-- Create trigger for status updates
CREATE TRIGGER update_order_tracking_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_order_tracking_on_status_change();

-- Update existing orders to have tracking if they don't
DO $$
DECLARE
  order_record RECORD;
BEGIN
  FOR order_record IN 
    SELECT o.id, o.status, o.created_at 
    FROM orders o
    WHERE NOT EXISTS (
      SELECT 1 FROM order_tracking ot WHERE ot.order_id = o.id
    )
  LOOP
    INSERT INTO order_tracking (order_id, status, message, created_at)
    VALUES (
      order_record.id,
      order_record.status,
      'Order has been placed successfully.',
      order_record.created_at
    );
  END LOOP;
END $$;
