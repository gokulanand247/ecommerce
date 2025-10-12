# Razorpay Webhook Setup Guide

## Problem: Orders Showing as Placed Without Payment

Currently, when users close the Razorpay payment gateway without paying, the order is still created with `payment_status: 'pending'`. This is because the order is created **before** the payment is initiated.

## Solution: Implement Razorpay Webhooks

Webhooks allow Razorpay to notify your server about payment events in real-time, ensuring payment verification happens on the backend.

---

## Step 1: Understanding the Payment Flow

### Current Flow (Problematic):
1. User clicks "Pay"
2. **Order is created immediately** with `status: 'pending'` and `payment_status: 'pending'`
3. Razorpay payment gateway opens
4. User closes the gateway without paying
5. **Order still exists as "placed"** ❌

### Improved Flow (With Webhooks):
1. User clicks "Pay"
2. **Order is created** with `payment_status: 'pending'`
3. Razorpay payment gateway opens
4. User completes payment OR closes gateway
5. **Razorpay sends webhook** to your server
6. Your server verifies the payment and updates order status accordingly ✅
7. Unpaid orders are auto-cancelled after 30 minutes

---

## Step 2: Set Up Razorpay Webhook

### A. Create Webhook Endpoint in Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **"+ Add New Webhook"**
4. Configure:
   - **Webhook URL**: `https://your-domain.com/api/razorpay-webhook`
   - **Active Events**: Select the following:
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
   - **Secret**: Generate a strong secret (save this, you'll need it)
5. Click **"Create Webhook"**

---

## Step 3: Create Supabase Edge Function for Webhook

You need to create a Supabase Edge Function to handle webhook callbacks from Razorpay.

### Create the Edge Function

Create a new file: `supabase/functions/razorpay-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Razorpay-Signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook signature from headers
    const signature = req.headers.get('X-Razorpay-Signature');
    const body = await req.text();

    // Verify webhook signature
    const expectedSignature = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(body + razorpayWebhookSecret)
    );
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignatureHex) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    const paymentId = event.payload.payment.entity.id;
    const orderId = event.payload.payment.entity.notes?.order_id;

    console.log('Webhook event:', event.event);
    console.log('Payment ID:', paymentId);
    console.log('Order ID:', orderId);

    if (!orderId) {
      console.error('Order ID not found in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Order ID not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different payment events
    switch (event.event) {
      case 'payment.captured':
      case 'payment.authorized':
        // Payment successful - update order
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_id: paymentId,
            payment_status: 'completed',
            status: 'confirmed'
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        // Add tracking entry
        await supabase
          .from('order_tracking')
          .insert([{
            order_id: orderId,
            status: 'confirmed',
            message: 'Payment confirmed. Order is being processed.',
            location: 'Processing Center'
          }]);

        console.log('Order updated successfully:', orderId);
        break;

      case 'payment.failed':
        // Payment failed - update order status
        const { error: failError } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('id', orderId);

        if (failError) {
          console.error('Error updating failed order:', failError);
          throw failError;
        }

        console.log('Order marked as failed:', orderId);
        break;

      default:
        console.log('Unhandled event type:', event.event);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Step 4: Deploy the Edge Function

Deploy using the Supabase CLI or use your deployment tool.

---

## Step 5: Add Webhook Secret to Environment Variables

In your Supabase Dashboard:
1. Go to **Settings** → **Edge Functions**
2. Add environment variable:
   - Key: `RAZORPAY_WEBHOOK_SECRET`
   - Value: The secret you generated in Razorpay Dashboard

---

## Step 6: Update Frontend Order Creation

Update the `createOrder` function to include the order ID in Razorpay notes:

```typescript
const options = {
  key: 'rzp_live_RPqf3ZMoQBXot7',
  amount: Math.round(finalTotal * 100),
  currency: 'INR',
  name: 'DressHub',
  description: `Order #${order.id.substring(0, 8)}`,
  handler: async function (response: any) {
    // Payment handled by webhook
    // Just show success message
    alert('Payment successful! Your order has been placed.');
    onOrderComplete();
  },
  notes: {
    order_id: order.id,  // ← Important: This allows webhook to find the order
  },
  // ... rest of options
};
```

---

## Step 7: Auto-Cancel Unpaid Orders

Set up a scheduled function to run periodically (every 10-15 minutes) to cancel unpaid orders:

### Option A: Supabase Cron Job (Recommended)

Create another Edge Function `supabase/functions/cancel-unpaid-orders/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cancel orders pending for more than 30 minutes
    const { data, error } = await supabase.rpc('cancel_unpaid_orders');

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Unpaid orders cancelled' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Then set up a cron job using a service like:
- **Cron-job.org** (Free)
- **EasyCron**
- **Vercel Cron** (if using Vercel)

Configure it to call: `https://your-project.supabase.co/functions/v1/cancel-unpaid-orders` every 15 minutes.

---

## Step 8: Testing the Webhook

### Test Webhook Locally:
1. Use Razorpay's webhook testing tool in the dashboard
2. Or use `ngrok` to expose your local server
3. Test with test payment credentials

### Test Events:
- Complete a payment → Order should be marked as "confirmed"
- Fail a payment → Order should be marked as "cancelled"
- Close payment gateway → Order should auto-cancel after 30 minutes

---

## Summary

✅ **Webhook ensures payment verification happens on the backend**
✅ **Only successful payments mark orders as confirmed**
✅ **Failed/abandoned payments are handled correctly**
✅ **Unpaid orders auto-cancel after 30 minutes**

---

## Important Notes

1. **Never trust frontend payment confirmations alone** - Always verify on backend
2. **Store Razorpay order IDs** for reconciliation
3. **Test thoroughly** with Razorpay test mode before going live
4. **Monitor webhook logs** in Razorpay Dashboard for debugging
5. **Set up proper error notifications** for failed webhooks

---

## Need Help?

- [Razorpay Webhook Documentation](https://razorpay.com/docs/webhooks/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- Check Razorpay Dashboard → **Webhooks** → **Logs** for debugging
