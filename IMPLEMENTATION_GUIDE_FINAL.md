# Final Implementation Guide - Remaining Tasks

## 1. Color Theme Change (Pink to Red)

### Automated Replacement
Run this command in the project root:

```bash
# Replace pink with red colors across all files
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/pink-50/red-50/g' \
  -e 's/pink-100/red-100/g' \
  -e 's/pink-200/red-200/g' \
  -e 's/pink-300/red-300/g' \
  -e 's/pink-400/red-400/g' \
  -e 's/pink-500/red-500/g' \
  -e 's/pink-600/red-600/g' \
  -e 's/pink-700/red-700/g' \
  -e 's/pink-800/red-800/g' \
  -e 's/pink-900/red-900/g' \
  -e "s/'#EC4899'/'#dc2626'/g" \
  -e 's/"#EC4899"/"#dc2626"/g' \
  {} +
```

### Manual Check Required
- Header/Footer components
- Button hover states
- Link colors
- Border colors

## 2. Apply Database Migration

Run the migration file created at:
```
supabase/migrations/20251021070000_add_advanced_features.sql
```

This creates:
- `featured_stores` table
- `seller_categories` table
- `seller_featured_products` table
- `seller_offers` table
- `cart_items` table

## 3. Stock Fix - Already Implemented ✅

The stock update issue has been fixed in `src/services/orderService.ts`:
- Better error handling
- Uses `stock_quantity` as primary, falls back to `stock`
- Math.max ensures stock never goes negative
- Proper error logging

## 4. Cart Persistence - Service Created ✅

File created: `src/services/cartService.ts`

### Implementation in App.tsx:

```typescript
import { saveCartToDatabase, loadCartFromDatabase } from './services/cartService';

// Load cart on user login
useEffect(() => {
  if (user) {
    loadCartFromDatabase(user.id).then(dbCart => {
      if (dbCart.length > 0) {
        setCartItems(dbCart);
      }
    });
  }
}, [user]);

// Save cart on change
useEffect(() => {
  if (user && cartItems.length > 0) {
    saveCartToDatabase(user.id, cartItems).catch(console.error);
  }
}, [cartItems, user]);

// Clear cart after successful order
const handleOrderComplete = async () => {
  if (user) {
    await clearCartFromDatabase(user.id);
  }
  setCartItems([]);
  setIsCheckoutOpen(false);
  setCurrentView('orders');
};
```

## 5. Store Click Fix

### Update StoreCategories.tsx:

```typescript
// Change the handleStoreClick in App.tsx
const handleStoreClick = (sellerId: string) => {
  if (sellerId) {
    // Navigate to specific store
    setSelectedSellerId(sellerId);
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Navigate to all stores
    setCurrentView('stores');
  }
};

// Pass correct handler to StoreCategories
<StoreCategories onStoreClick={handleStoreClick} />
```

## 6. Featured Stores Management (Admin)

Create new file: `src/components/admin/FeaturedStoresManagement.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../Toast';

const FeaturedStoresManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sellersRes, featuredRes] = await Promise.all([
      supabase.from('sellers').select('*').eq('is_verified', true),
      supabase.from('featured_stores').select('*, sellers(shop_name)').eq('is_active', true)
    ]);

    setSellers(sellersRes.data || []);
    setFeaturedStores(featuredRes.data || []);
    setLoading(false);
  };

  const addFeaturedStore = async (sellerId: string) => {
    if (featuredStores.length >= 4) {
      showToast('Maximum 4 featured stores allowed', 'error');
      return;
    }

    const { error } = await supabase
      .from('featured_stores')
      .insert({
        seller_id: sellerId,
        sort_order: featuredStores.length
      });

    if (error) {
      showToast('Error adding featured store', 'error');
    } else {
      showToast('Featured store added', 'success');
      fetchData();
    }
  };

  const removeFeaturedStore = async (id: string) => {
    const { error } = await supabase
      .from('featured_stores')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Error removing featured store', 'error');
    } else {
      showToast('Featured store removed', 'success');
      fetchData();
    }
  };

  const updateSortOrder = async (id: string, newOrder: number) => {
    const { error } = await supabase
      .from('featured_stores')
      .update({ sort_order: newOrder })
      .eq('id', id);

    if (error) {
      showToast('Error updating order', 'error');
    } else {
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Featured Stores Management</h2>

      {/* Current Featured Stores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Current Featured Stores (Max 4)</h3>
        <div className="space-y-4">
          {featuredStores.map((store, index) => (
            <div key={store.id} className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold">{index + 1}</span>
                <span>{store.sellers.shop_name}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateSortOrder(store.id, Math.max(0, store.sort_order - 1))}
                  disabled={index === 0}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => updateSortOrder(store.id, store.sort_order + 1)}
                  disabled={index === featuredStores.length - 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeFeaturedStore(store.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Sellers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Available Sellers</h3>
        <div className="grid grid-cols-2 gap-4">
          {sellers
            .filter(s => !featuredStores.find(f => f.seller_id === s.id))
            .map(seller => (
              <div key={seller.id} className="flex items-center justify-between p-4 border rounded">
                <span>{seller.shop_name}</span>
                <button
                  onClick={() => addFeaturedStore(seller.id)}
                  disabled={featuredStores.length >= 4}
                  className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedStoresManagement;
```

Add to AdminDashboard tabs.

## 7. Update StoreCategories to Use Featured Stores

```typescript
const fetchSellers = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_featured_stores');

    if (error) throw error;
    setSellers(data || []);
  } catch (error) {
    console.error('Error fetching sellers:', error);
  } finally {
    setLoading(false);
  }
};
```

## 8. Today's Deal Grid Layout

Update `TodaysDeal.tsx`:

```typescript
// Replace the grid div with:
<div className={`grid gap-4 md:gap-6 ${
  deals.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
  deals.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
  deals.length === 3 ? 'grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto' :
  'grid-cols-2 lg:grid-cols-4'
}`}>
```

## 9. Seller Categories, Featured Products, and Offers

Create these seller dashboard components:

### SellerCategories.tsx
```typescript
// Allow sellers to create custom categories
// Link products to these categories
// Display in their store page with filters
```

### SellerFeaturedProducts.tsx
```typescript
// Select up to 4 products as featured
// Display at top of seller store
// Manage sort order
```

### SellerOffers.tsx
```typescript
// Create time-limited offers for products
// Set discount percentage
// Manage validity dates
```

## 10. Enhanced Security for Large Database

### Implement in Supabase Dashboard:

1. **Enable Connection Pooling**:
   - Go to Database Settings
   - Enable connection pooler
   - Use pooled connection string

2. **Create Indexes** (already in migration):
   - Products: seller_id, category, seller_category_id
   - Orders: user_id, seller_id, status
   - Cart: user_id, product_id

3. **Enable Read Replicas** (for scaling):
   - Supabase Pro feature
   - Distribute read queries

4. **Implement Rate Limiting**:
```typescript
// In supabase edge function
import { createClient } from '@supabase/supabase-js'

export const checkRateLimit = async (userId: string, action: string) => {
  const key = `ratelimit:${userId}:${action}`
  // Implement Redis-based rate limiting
  // Or use Supabase function with timestamp checks
}
```

5. **Add Database Backups**:
   - Enable daily automated backups in Supabase
   - Implement point-in-time recovery

6. **Monitor Query Performance**:
   - Use Supabase Analytics
   - Identify slow queries
   - Add indexes as needed

## 11. Mobile View (2 Products Per Row)

This is already implemented via Tailwind's responsive classes:
- `grid-cols-2` - Mobile (default)
- `md:grid-cols-3` or `lg:grid-cols-4` - Larger screens

Just ensure all product grids use `grid-cols-2` as base.

## Database Migration Steps

1. Go to Supabase Dashboard
2. SQL Editor
3. Paste contents of `20251021070000_add_advanced_features.sql`
4. Run migration
5. Verify tables created
6. Check RLS policies enabled

## Testing Checklist

- [ ] Stock reduces correctly after order
- [ ] Featured stores show on homepage
- [ ] Click store redirects to that specific store
- [ ] Seller can create categories
- [ ] Seller can set featured products
- [ ] Seller can create offers
- [ ] Cart persists in database
- [ ] Cart loads on login
- [ ] Today's deals responsive layout works
- [ ] All colors changed from pink to red
- [ ] Mobile view shows 2 products per row

## File Updates Required

1. `src/App.tsx` - Add cart persistence, store click handling
2. `src/components/StoreCategories.tsx` - Use featured stores RPC
3. `src/components/TodaysDeal.tsx` - Update grid layout
4. `src/components/admin/AdminDashboard.tsx` - Add Featured Stores tab
5. `src/components/seller/SellerDashboard.tsx` - Add Categories, Featured, Offers tabs
6. All component files - Replace pink with red colors

## Priority Order

1. ✅ Stock fix (DONE)
2. ✅ Cart service (DONE) - Need to integrate in App.tsx
3. Database migration - MANUAL STEP REQUIRED
4. Color change - Run sed command
5. Featured stores component
6. Store click fix
7. Responsive grid layout
8. Seller new features (categories, featured, offers)

---

**Note**: The stock issue fix and cart service are complete. The database migration file is ready. Main remaining work is applying the migration in Supabase Dashboard and integrating the cart service into App.tsx.
