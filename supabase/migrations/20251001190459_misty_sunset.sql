@@ .. @@
 -- Create trigger function for updating updated_at column
-CREATE OR REPLACE FUNCTION update_updated_at_column()
+CREATE OR REPLACE FUNCTION update_updated_at_column()
 RETURNS TRIGGER AS $$
 BEGIN
     NEW.updated_at = CURRENT_TIMESTAMP;
@@ .. @@
 );
 
 -- Create trigger for products table
-CREATE TRIGGER update_products_updated_at
+CREATE TRIGGER IF NOT EXISTS update_products_updated_at
     BEFORE UPDATE ON products
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
@@ .. @@
 );
 
 -- Create trigger for users table
-CREATE TRIGGER update_users_updated_at
+CREATE TRIGGER IF NOT EXISTS update_users_updated_at
     BEFORE UPDATE ON users
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
@@ .. @@
 );
 
 -- Create trigger for orders table
-CREATE TRIGGER update_orders_updated_at
+CREATE TRIGGER IF NOT EXISTS update_orders_updated_at
     BEFORE UPDATE ON orders
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();