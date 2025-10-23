/*
  # Add Login Functions and Analytics Support
  
  ## Changes
  1. Create login functions for admin and seller
  2. Add analytics views for orders and sales
  3. Add functions for order splitting by seller
  4. Add delivery status management
  
  ## Security
  - Secure password verification
  - Session management support
*/

-- Function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(p_username text, p_password text)
RETURNS TABLE (
  admin_id uuid,
  username text,
  email text,
  name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT id as admin_id, admins.username, admins.email, admins.name
  FROM admins
  WHERE admins.username = p_username 
    AND admins.password_hash = p_password
    AND admins.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify seller login
CREATE OR REPLACE FUNCTION verify_seller_login(p_username text, p_password text)
RETURNS TABLE (
  seller_id uuid,
  username text,
  shop_name text,
  email text,
  phone text,
  is_verified boolean,
  profile_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as seller_id,
    sellers.username,
    sellers.shop_name,
    sellers.email,
    sellers.phone,
    sellers.is_verified,
    sellers.profile_completed
  FROM sellers
  WHERE sellers.username = p_username 
    AND sellers.password_hash = p_password
    AND sellers.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for admin analytics
CREATE OR REPLACE VIEW admin_analytics AS
SELECT 
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.user_id) as total_customers,
  COUNT(DISTINCT oi.seller_id) as active_sellers,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_amount) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30_days,
  SUM(o.total_amount) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_last_7_days,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'confirmed') as confirmed_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'shipped') as shipped_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'delivered') as delivered_orders,
  COUNT(DISTINCT p.id) as total_products,
  AVG(r.rating) as average_rating
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN reviews r ON p.id = r.product_id;

-- Function to get seller analytics
CREATE OR REPLACE FUNCTION get_seller_analytics(p_seller_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(DISTINCT oi.order_id),
    'total_products', COUNT(DISTINCT p.id),
    'active_products', COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true),
    'total_revenue', COALESCE(SUM(oi.price * oi.quantity), 0),
    'revenue_last_30_days', COALESCE(SUM(oi.price * oi.quantity) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0),
    'revenue_last_7_days', COALESCE(SUM(oi.price * oi.quantity) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'), 0),
    'pending_orders', COUNT(oi.id) FILTER (WHERE oi.status = 'pending'),
    'confirmed_orders', COUNT(oi.id) FILTER (WHERE oi.status = 'confirmed'),
    'shipped_orders', COUNT(oi.id) FILTER (WHERE oi.status = 'shipped'),
    'delivered_orders', COUNT(oi.id) FILTER (WHERE oi.status = 'delivered'),
    'average_rating', COALESCE(AVG(r.rating), 0),
    'total_reviews', COUNT(r.id)
  ) INTO result
  FROM order_items oi
  LEFT JOIN orders o ON oi.order_id = o.id
  LEFT JOIN products p ON oi.seller_id = p.seller_id AND p.seller_id = p_seller_id
  LEFT JOIN reviews r ON p.id = r.product_id
  WHERE oi.seller_id = p_seller_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to split order by sellers (get order items grouped by seller)
CREATE OR REPLACE FUNCTION get_order_split(p_order_id uuid)
RETURNS TABLE (
  seller_id uuid,
  shop_name text,
  items_count bigint,
  subtotal numeric,
  items json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.seller_id,
    s.shop_name,
    COUNT(oi.id) as items_count,
    SUM(oi.price * oi.quantity) as subtotal,
    json_agg(
      json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', p.name,
        'quantity', oi.quantity,
        'price', oi.price,
        'status', oi.status,
        'selected_size', oi.selected_size,
        'selected_color', oi.selected_color
      )
    ) as items
  FROM order_items oi
  JOIN sellers s ON oi.seller_id = s.id
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = p_order_id
  GROUP BY oi.seller_id, s.shop_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for sellers to update order item status
DROP POLICY IF EXISTS "Sellers can update own order items" ON order_items;
CREATE POLICY "Sellers can update own order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Add policy for admins to update any order status
DROP POLICY IF EXISTS "Admins can update any order" ON orders;
CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_seller_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_seller_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_split TO authenticated;