# Manual Migrations

These SQL files need to be run manually in your Supabase SQL Editor.

## Migration Order

Run these migrations in the following order:

1. **01_fix_stock_issues.sql** - Fixes all stock management problems
2. **02_multi_seller_order_system.sql** - Implements multi-seller order splitting
3. **03_fix_reviews.sql** - Fixes review submission issues

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of each file
4. Paste into the SQL Editor
5. Click "Run" to execute
6. Verify there are no errors
7. Move to the next file

## What Each Migration Does

### 01_fix_stock_issues.sql
- Fixes stock never falling back to 0 on product create/update
- Properly syncs stock and stock_quantity fields
- Adds automatic stock decrease when orders are created
- Adds stock restoration when orders are cancelled
- Prevents stock from going negative

### 02_multi_seller_order_system.sql
- Creates order_items table for tracking individual items by seller
- Implements automatic order splitting by seller
- Syncs order status based on all item statuses
- Adds proper RLS policies for users, sellers, and admins
- Backfills existing orders into the new system

### 03_fix_reviews.sql
- Fixes review submission permissions
- Adds proper validation for ratings and comments
- Updates RLS policies to allow authenticated users to submit reviews
- Allows anyone to view reviews

## After Running Migrations

After running all migrations, the following features will work:
- Stock management will be fixed
- Orders will automatically split by seller
- Reviews will submit properly
- All RLS policies will be in place
