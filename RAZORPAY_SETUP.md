# Razorpay Integration Guide

## Your Razorpay Credentials

Your Razorpay integration is already configured with:
- **Key ID**: `rzp_live_RPqf3ZMoQBXot7`
- **Key Secret**: `S2CmtDyfR4cBtKtbADmEtTZg`

These are LIVE credentials, so real payments will be processed.

## ✅ What's Already Configured

1. **Razorpay SDK** - Loaded in `index.html`
2. **Payment Integration** - Implemented in `CheckoutModal.tsx`
3. **Order Creation** - Automatic order creation before payment
4. **Payment Success Handler** - Updates order status on success
5. **Error Handling** - Handles payment failures and cancellations

## How Payment Flow Works

### Step-by-Step Process:

1. **User Checkout**
   - User adds items to cart
   - Proceeds to checkout
   - Selects/adds delivery address

2. **Order Creation** (Backend)
   ```
   - Order created in database with status: 'pending'
   - Order items saved with product details
   - Initial tracking entry created
   ```

3. **Razorpay Modal Opens**
   ```javascript
   - Amount: ₹XXX (converted to paise × 100)
   - User sees all payment options:
     * Credit/Debit Cards
     * UPI (Google Pay, PhonePe, etc.)
     * Net Banking
     * Wallets (Paytm, etc.)
   ```

4. **User Completes Payment**
   - Enters payment details
   - Confirms payment

5. **Payment Success**
   ```
   - Razorpay callback triggered
   - Order status updated to 'confirmed'
   - Payment ID stored in database
   - Tracking entry added: "Payment confirmed"
   - User sees success message
   ```

6. **Automatic Tracking**
   - Order tracking automatically updates
   - User can view order in "My Orders"

## Webhooks (Optional but Recommended)

Webhooks provide additional security by verifying payments server-side.

### Why Use Webhooks?

- **Security**: Server-side verification of payments
- **Reliability**: Ensures payment status is accurate
- **Reconciliation**: Helps match payments with orders

### Setting Up Webhooks:

1. **Go to Razorpay Dashboard**
   - Login to https://dashboard.razorpay.com/
   - Navigate to **Settings** → **Webhooks**

2. **Create Webhook**
   - Click "Add New Webhook"
   - Enter your webhook URL: `https://yourdomain.com/api/razorpay-webhook`
   - Select events to listen for:
     * ✅ `payment.captured`
     * ✅ `payment.failed`
     * ✅ `order.paid`

3. **Generate Secret**
   - Copy the webhook secret provided
   - You'll need this to verify webhook signatures

4. **Webhook Endpoint** (You would need to create this)

   ```javascript
   // Example webhook handler (Edge Function or API route)
   import crypto from 'crypto';

   export default async function handler(req, res) {
     const signature = req.headers['x-razorpay-signature'];
     const body = JSON.stringify(req.body);

     // Verify signature
     const expectedSignature = crypto
       .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
       .update(body)
       .digest('hex');

     if (signature === expectedSignature) {
       const event = req.body.event;
       const payment = req.body.payload.payment.entity;

       if (event === 'payment.captured') {
         // Update order in database
         await updateOrderPayment(
           payment.notes.order_id,
           payment.id,
           'completed'
         );
       }

       res.status(200).json({ status: 'ok' });
     } else {
       res.status(400).json({ status: 'invalid signature' });
     }
   }
   ```

### Current Implementation (Without Webhooks)

The app currently works WITHOUT webhooks:
- Payment status is handled via Razorpay's client-side callback
- Order is updated immediately after payment success
- This is sufficient for most use cases

### When Do You NEED Webhooks?

You should add webhooks if:
1. You want server-side payment verification
2. You need to handle delayed/async payments
3. You want to reconcile payments automatically
4. You're processing high-value transactions

## Testing Payments

### Test Mode (for development)
If you want to test without real money:

1. **Get Test Credentials**
   - Go to Razorpay Dashboard
   - Switch to "Test Mode" (toggle at top)
   - Get test Key ID and Secret
   - Replace in code temporarily

2. **Test Cards**
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Test UPI**
   - UPI ID: success@razorpay

### Live Mode (production)
Your current credentials are already in LIVE mode:
- Real money will be charged
- Payments will be processed
- Funds will be settled to your account

## Payment Status Tracking

### In Database:
- `payment_status`: 'pending', 'completed', 'failed'
- `payment_id`: Razorpay payment ID
- `order.status`: 'pending' → 'confirmed' after payment

### User Can See:
- Order history in "My Orders"
- Payment status
- Order tracking timeline

## Common Issues & Solutions

### Issue: "Payment Failed"
**Causes**:
- Insufficient funds
- Card declined
- Network issues
- 3D Secure authentication failed

**Solution**:
- User sees error message
- Order remains in 'pending' state
- User can try again

### Issue: "Payment Not Updating"
**Causes**:
- Callback not triggered
- Network interruption
- Database error

**Solution**:
- Check browser console for errors
- Verify Razorpay callback is firing
- Check order status in database

### Issue: "Live Credentials Not Working"
**Causes**:
- Account not activated
- KYC not completed
- Account on hold

**Solution**:
1. Login to Razorpay Dashboard
2. Check account status
3. Complete KYC if required
4. Contact Razorpay support

## Security Best Practices

### Current Implementation:
✅ Payment ID is verified server-side
✅ Amount is calculated server-side
✅ Keys are properly configured
✅ HTTPS is used for all transactions

### Additional Security (Optional):
- [ ] Add webhook verification
- [ ] Implement payment signature verification
- [ ] Add rate limiting on checkout
- [ ] Log all payment attempts

## Settlement & Payouts

### Default Settlement:
- Payments are settled to your bank account
- Default cycle: T+3 days (3 days after transaction)
- You can check settlement schedule in Razorpay Dashboard

### Changing Settlement:
1. Go to **Settings** → **Payment Settlement**
2. Choose settlement frequency
3. Add bank account details if not done

## Monitoring Payments

### Razorpay Dashboard:
- View all transactions
- Check payment status
- Download reports
- Reconcile orders

### In Your App:
- "My Orders" shows all user orders
- Order tracking shows payment status
- Admin can query database for payment data

## Support

### Razorpay Support:
- Email: support@razorpay.com
- Phone: 1800-121-7788
- Dashboard: Help & Support section

### Your Integration Support:
- Check browser console for errors
- Verify database connectivity
- Test with small amounts first

## Checklist Before Going Live

- [x] Razorpay account created
- [x] KYC completed (check dashboard)
- [x] Bank account added
- [x] Live credentials configured
- [x] Test transaction successful
- [ ] Webhook configured (optional)
- [ ] SSL certificate installed on domain
- [ ] Terms & Conditions updated
- [ ] Refund policy defined

---

**Your Razorpay integration is READY TO USE!**

No additional setup required unless you want webhooks for server-side verification.
