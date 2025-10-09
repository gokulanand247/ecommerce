# Admin Panel - Complete Guide

## 🔐 Admin Access

### Default Credentials:
- **Username**: `admin`
- **Password**: `Admin@123`

### How to Access:
1. Scroll to footer
2. Click "Admin" link
3. Enter credentials
4. Login to admin dashboard

## 📦 Features

### 1. Product Management
Complete CRUD operations for products:

#### Add New Product:
1. Click "Add New Product" button
2. Fill in all details:
   - **Product Name** (required)
   - **Category** (Sarees, Western, Ethnic, Party, Casual)
   - **MRP** - Maximum Retail Price (required)
   - **Selling Price** - Actual selling price (required)
   - **Stock Quantity** - Available stock
   - **Description** - Product details
   - **Image** - Upload from device OR enter URL
   - **Sizes** - Select available sizes (XS, S, M, L, XL, XXL, Free Size)
   - **Colors** - Select available colors
   - **Active Status** - Enable/disable product

3. Click "Create Product"
4. Product appears in user interface immediately

#### Edit Product:
1. Find product in products list
2. Click "Edit" button
3. Modify any field
4. Click "Update Product"

#### Delete Product:
1. Find product in products list
2. Click "Delete" button
3. Confirm deletion
4. Product removed from database

#### Image Upload:
- **Option 1**: Click "Choose Image" and select from device
- **Option 2**: Enter image URL directly
- Preview shown before saving
- Images stored in Supabase Storage

---

### 2. Order Management

View and manage all customer orders:

#### Order List:
- Shows all orders with:
  - Order ID
  - Customer name
  - Order date
  - Total amount
  - Current status
  - Number of items

#### Order Details:
Click any order to view:

**Customer Information:**
- Name
- Email
- Phone number

**Delivery Address:**
- Full address with PIN code
- Contact number

**Order Items:**
- Product images
- Product names
- Quantities
- Sizes and colors selected
- Prices (MRP vs selling price)

**Payment Information:**
- Subtotal
- Total amount
- Payment status
- Payment ID (Razorpay)

**Tracking Information:**
- Tracking number (when shipped)

#### Update Order Status:
1. Select an order
2. Use dropdown to change status:
   - **Pending** - Order placed, payment pending
   - **Confirmed** - Payment confirmed
   - **Processing** - Order being prepared
   - **Shipped** - Order dispatched
   - **Out for Delivery** - With delivery person
   - **Delivered** - Successfully delivered
   - **Cancelled** - Order cancelled

3. Status updates immediately
4. Customer sees new status in "My Orders"
5. Tracking timeline updated automatically

---

## 🎨 Admin Panel UI

### Dashboard Features:
- **Gradient Header** - Pink to purple gradient
- **Tab Navigation** - Easy switch between Products and Orders
- **Responsive Design** - Works on all devices
- **Color-coded Status** - Easy status identification
- **Search and Filter** - (Can be added)

### Product Cards:
- Product image
- Name and category
- Price with MRP comparison
- Stock information
- Quick edit/delete actions

### Order Cards:
- Color-coded status badges
- Quick order information
- Click to view full details
- Status dropdown for quick updates

---

## 🔄 Workflow

### New Product Flow:
```
Admin adds product → Product in database →
Shows in user interface → Users can purchase
```

### Order Flow:
```
User places order → Appears in admin panel →
Admin updates status → User sees update →
Tracking auto-updates → Order delivered
```

### Status Update Flow:
```
Admin changes status → Database updated →
Tracking entry created → User notified in app
```

---

## 🛡️ Security

### Admin Authentication:
- Username/password login
- Passwords hashed with bcrypt
- Session management
- No forgot password (intentional security)
- No self-registration (admin creates accounts)

### Database Security:
- RLS (Row Level Security) enabled
- Admin verification function
- Secure password storage
- Last login tracking

### Product Image Security:
- Images stored in Supabase Storage
- Public URLs for images
- File type validation (on upload)
- Size limits (managed by Supabase)

---

## 📝 Database Tables

### `admins` Table:
```sql
- id: UUID (primary key)
- username: text (unique)
- password_hash: text (bcrypt)
- email: text (unique)
- name: text
- is_active: boolean
- last_login: timestamp
- created_at: timestamp
```

### Admin Functions:
- `verify_admin_login()` - Validates credentials
- Updates last_login on successful login
- Returns admin data (without password)

---

## 🖼️ Image Management

### Uploading from Device:
1. Click "Choose Image"
2. Select image file (JPG, PNG, etc.)
3. Preview shown instantly
4. Image uploaded to Supabase on save
5. Public URL generated automatically

### Using Image URLs:
1. Find image online (e.g., Pexels, Unsplash)
2. Copy image URL
3. Paste in "Image URL" field
4. Image loads from URL

### Storage Setup Required:

**⚠️ IMPORTANT**: You need to create storage bucket in Supabase:

1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. Click "New Bucket"
4. Name: `product-images`
5. Set as **Public** bucket
6. Click "Create bucket"

**Policies Needed:**
```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow uploads (you can restrict this)
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' );
```

---

## 🎯 Use Cases

### Daily Operations:

**Morning:**
1. Check new orders
2. Update order statuses
3. Process shipped orders

**Throughout Day:**
1. Add new products
2. Update stock levels
3. Edit product details
4. Respond to order status changes

**End of Day:**
1. Review all orders
2. Update tracking information
3. Plan next day shipments

### Product Management:

**Adding Seasonal Collection:**
1. Prepare product images
2. Add products one by one or bulk
3. Set appropriate prices
4. Enable all products
5. Products visible to customers

**Sale/Discount:**
1. Edit products
2. Lower selling price
3. Keep MRP same (shows discount %)
4. Save changes

**Out of Stock:**
1. Edit product
2. Set stock to 0
3. Or disable product
4. Product shown as unavailable

---

## 📊 Order Status Guide

### Status Flow:
```
Pending → Confirmed → Processing →
Shipped → Out for Delivery → Delivered
```

### When to Use Each Status:

**Pending:**
- New order received
- Payment verification pending

**Confirmed:**
- Payment successful
- Order verified

**Processing:**
- Packing order
- Preparing for shipment

**Shipped:**
- Package handed to courier
- Tracking number generated
- Expected delivery date set

**Out for Delivery:**
- Package with delivery person
- Will be delivered today

**Delivered:**
- Package delivered successfully
- Order complete

**Cancelled:**
- Customer requested cancellation
- Payment issue
- Stock unavailable

---

## ⚙️ Customization

### Adding More Admins:

```sql
INSERT INTO admins (username, password_hash, email, name)
VALUES (
  'newadmin',
  crypt('Password123', gen_salt('bf')),
  'newadmin@dresshub.com',
  'New Admin Name'
);
```

### Changing Admin Password:

```sql
UPDATE admins
SET password_hash = crypt('NewPassword', gen_salt('bf'))
WHERE username = 'admin';
```

### Adding More Categories:

Edit `AdminDashboard.tsx`:
```javascript
const categories = [
  { id: 'sarees', name: 'Sarees' },
  { id: 'western', name: 'Western Wear' },
  { id: 'ethnic', name: 'Ethnic Wear' },
  { id: 'party', name: 'Party Wear' },
  { id: 'casual', name: 'Casual Wear' },
  { id: 'new-category', name: 'New Category' } // Add here
];
```

Also update in `mockProducts.ts` categories.

---

## 🐛 Troubleshooting

### Can't Login:
- Check username/password carefully
- Username: `admin` (lowercase)
- Password: `Admin@123` (case-sensitive)
- Check browser console for errors

### Image Upload Not Working:
- **Create storage bucket** `product-images`
- Make bucket public
- Add storage policies
- Check image file size (should be reasonable)

### Products Not Showing:
- Check "Active Status" is enabled
- Verify product was saved successfully
- Check browser console for errors
- Refresh products list

### Order Status Not Updating:
- Check internet connection
- Verify database connection
- Check browser console
- Try refreshing page

---

## 📱 Mobile Admin Access

The admin panel is fully responsive:
- ✅ Works on tablets
- ✅ Works on smartphones
- ✅ Touch-friendly buttons
- ✅ Optimized layouts

---

## 🚀 Best Practices

### Product Management:
1. Use high-quality images
2. Write clear descriptions
3. Set realistic stock levels
4. Update prices regularly
5. Keep products active/inactive as needed

### Order Management:
1. Update status promptly
2. Add tracking numbers when shipping
3. Communicate with customers
4. Monitor pending orders
5. Process orders in sequence

### Security:
1. Don't share admin credentials
2. Logout when done
3. Change default password
4. Monitor admin access
5. Create separate admin accounts for team

---

## 🎉 Key Benefits

1. **No Database Access Needed** - Everything through UI
2. **Real-time Updates** - Changes reflect immediately
3. **Image Upload** - Direct from device
4. **Order Tracking** - Complete visibility
5. **Status Management** - Easy dropdown updates
6. **Responsive Design** - Works everywhere
7. **Secure** - Password protected
8. **User-Friendly** - Intuitive interface

---

**Admin panel is fully functional and ready to use!**

Just create the storage bucket and start managing your e-commerce platform! 🎊
