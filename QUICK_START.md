# Quick Start Guide

## Immediate Actions Required

### Step 1: Update Environment Variables
Edit `.env` and replace these values with your actual credentials:
```
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_RAZORPAY_KEY_ID=your_actual_razorpay_key
```

### Step 2: Run Database Migrations
Go to your Supabase Dashboard → SQL Editor and run these files IN ORDER:

1. Copy contents of `manual_migrations/01_fix_stock_issues.sql` → Run
2. Copy contents of `manual_migrations/02_multi_seller_order_system.sql` → Run
3. Copy contents of `manual_migrations/03_fix_reviews.sql` → Run

### Step 3: Test the Application
```bash
npm run dev
```

## What Was Fixed

1. **Stock Management** - Products no longer revert to 0 stock
2. **Low Stock Warning** - Shows "Only X left!" in red when stock ≤ 3
3. **Order Stock Decrease** - Stock automatically decreases when orders are placed
4. **Review Submission** - Reviews now submit without errors
5. **Toast Notifications** - Custom success/error messages instead of alerts
6. **Filter Modal** - Filters open in a modal with Apply button
7. **Today's Deals** - Now displays correctly from database
8. **Multi-Seller Orders** - Orders automatically split by seller
9. **Password Hashing** - Use `node src/utils/hash.js <password>` to hash passwords

## Key Features

### Multi-Seller Order System
- Users see single unified order
- Sellers see only their products
- Admins see complete order split by seller
- Each seller can update their items independently

### Stock Management
- Automatic stock sync between fields
- Decreases on order placement
- Restores on cancellation
- Never goes negative

### Filter System
- Click "Filters & Sort" button
- Select your filters in modal
- Click "Apply Filters" to apply
- Click "Clear All" to reset

## Testing Multi-Seller Orders

1. Create products from different sellers
2. Add them to cart
3. Checkout and place order
4. Log in as seller 1 - see only their products
5. Log in as seller 2 - see only their products
6. Log in as admin - see all products with seller breakdown

## Password Hashing for Manual Seller Creation

```bash
node src/utils/hash.js myPassword123
```

Copy the output hash and run in Supabase SQL Editor:
```sql
UPDATE sellers SET password_hash = 'copied_hash' WHERE email = 'seller@example.com';
```

## File Structure

```
manual_migrations/
├── 01_fix_stock_issues.sql
├── 02_multi_seller_order_system.sql
├── 03_fix_reviews.sql
└── README.md

src/
├── components/
│   └── Toast.tsx (new - custom notifications)
├── utils/
│   └── hash.js (new - password hashing)
└── ...
```

## Troubleshooting

**Stock still showing 0?**
- Run migration 01_fix_stock_issues.sql

**Reviews not submitting?**
- Run migration 03_fix_reviews.sql

**Orders not splitting by seller?**
- Run migration 02_multi_seller_order_system.sql

**Today's Deals not showing?**
- Check `todays_deals` table has active deals
- Verify `starts_at` is before now and `ends_at` is after now

## Important Notes

- All migrations MUST be run for the system to work
- The `.env` file MUST have your actual credentials
- Test thoroughly after running migrations
- Use the hash.js utility for creating seller passwords manually

## Success Indicators

After setup, you should see:
- Products maintain their stock values
- Low stock warnings appear in red
- Reviews submit with success toast
- Filters open in modal
- Today's deals display (if you have active deals)
- Orders split correctly by seller

Everything is ready to go once migrations are run!
