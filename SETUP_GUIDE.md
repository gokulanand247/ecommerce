# DressHub E-commerce Platform - Setup Guide

## Critical Setup Steps

### 1. Disable Email Confirmation in Supabase

**This is MANDATORY for the app to work correctly!**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Click on **Email** provider
5. Scroll down to find **Confirm email** toggle
6. **DISABLE** the "Confirm email" option
7. Click **Save**

Without this step, users will receive confirmation emails and won't be able to login immediately after signup.

### 2. Razorpay Integration (Already Configured)

The application is configured with your Razorpay credentials:
- **Key ID**: `rzp_live_RPqf3ZMoQBXot7`
- **Key Secret**: `S2CmtDyfR4cBtKtbADmEtTZg`

No additional Razorpay configuration is needed. The payment gateway is fully integrated and will work immediately.

### 3. Environment Variables

Your `.env` file should already contain:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Implemented

### Authentication System
- ✅ Email and password-based authentication
- ✅ No email confirmation required (instant login)
- ✅ **Phone number is mandatory** during signup
- ✅ Passwords are automatically hashed by Supabase
- ✅ Forgot password functionality with email reset
- ✅ User data stored in database with proper RLS

### Payment Integration
- ✅ Razorpay payment gateway fully integrated
- ✅ Supports Credit/Debit Cards, UPI, Net Banking, Wallets
- ✅ Secure payment processing
- ✅ Payment status tracking
- ✅ Automatic order confirmation after payment

### Address Management
- ✅ Users can save multiple delivery addresses
- ✅ Addresses persist in database
- ✅ All saved addresses displayed during checkout
- ✅ Easy address selection and management
- ✅ Address validation (phone, pincode, etc.)

### Order Management & Tracking
- ✅ Complete order history for users
- ✅ **Automatic order tracking system**
- ✅ Real-time order status updates
- ✅ Tracking number generation for shipped orders
- ✅ Expected delivery date calculation
- ✅ Order status: Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered
- ✅ Detailed tracking timeline with locations

### Product Features
- ✅ Sample reviews pre-loaded for products
- ✅ Product ratings and review counts
- ✅ MRP vs discounted price display
- ✅ Size and color selection
- ✅ Stock management
- ✅ Category filtering

### Cart & Checkout
- ✅ MRP strikethrough with actual price
- ✅ Promo code system with validation
- ✅ Discount calculation
- ✅ Real-time total updates
- ✅ Secure checkout process

### Footer Pages
- ✅ About Us
- ✅ Size Guide with measurement tables
- ✅ Shipping Information
- ✅ Privacy Policy
- ✅ Terms & Conditions
- ✅ FAQ with expandable sections

### Today's Deals
- ✅ Time-limited special offers
- ✅ Countdown timer for deals
- ✅ Database-controlled deals
- ✅ Automatic expiry handling

## How Features Work

### User Registration Flow
1. User enters email, password, name, and **phone number (required)**
2. System creates account immediately (no email confirmation)
3. User is logged in automatically
4. User data is stored in database

### Order Flow
1. User adds items to cart
2. User proceeds to checkout
3. User selects or adds delivery address
4. User proceeds to payment
5. Razorpay payment modal opens
6. User completes payment
7. **Order automatically created with tracking**
8. Initial tracking entry: "Order placed"
9. As order status updates, tracking is automatically updated

### Automatic Tracking System
When order status changes:
- **Confirmed**: "Order confirmed and being prepared"
- **Processing**: "Order is being processed and packed"
- **Shipped**: Tracking number generated + Expected delivery date set
- **Out for Delivery**: "Will be delivered today"
- **Delivered**: "Order delivered successfully"

### Address Management
- First address is automatically set as default
- Users can add multiple addresses
- Addresses are saved permanently
- All addresses shown during checkout
- Easy selection via radio buttons

## Testing the Application

### Test User Registration
1. Go to the app
2. Click "Login/Register"
3. Click "Sign Up"
4. Fill in all fields including phone number
5. Click "Sign Up"
6. You should be logged in immediately

### Test Payment
1. Add items to cart
2. Proceed to checkout
3. Add/select address
4. Click "Pay"
5. Razorpay modal will open
6. Use test cards or complete real payment

### Test Order Tracking
1. Place an order
2. Go to "My Orders"
3. Click on the order
4. View tracking timeline
5. Status will update automatically

## Database Tables

- **users**: User profiles with email, name, phone
- **addresses**: User delivery addresses
- **products**: Product catalog
- **orders**: Order records
- **order_items**: Items in each order (includes MRP)
- **order_tracking**: Automatic tracking timeline
- **reviews**: Product reviews (with sample data)
- **promo_codes**: Discount codes
- **todays_deals**: Special time-limited offers
- **banners**: Homepage promotional banners

## Important Notes

1. **Email Confirmation MUST be disabled** in Supabase for the app to work
2. Razorpay credentials are already configured
3. Phone number is **mandatory** during signup
4. Passwords are hashed automatically by Supabase (bcrypt)
5. Order tracking is **fully automatic** - no manual intervention needed
6. Addresses are saved and persist across sessions
7. All RLS policies are properly configured for security

## Support

If you encounter any issues:
1. Verify email confirmation is disabled in Supabase
2. Check that environment variables are set correctly
3. Ensure Razorpay credentials are active
4. Check browser console for any errors
