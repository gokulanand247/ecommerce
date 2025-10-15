import { supabase } from '../lib/supabase';
import { CartItem, Address, Order, OrderItem } from '../types';

export const createOrder = async (
  userId: string,
  cartItems: CartItem[],
  address: Address,
  totalAmount: number,
  couponId?: string,
  discountAmount?: number,
  subtotal?: number
): Promise<Order> => {
  try {
    const items = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image_url: item.image
    }));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          address_id: address.id,
          total_amount: totalAmount,
          subtotal: subtotal || totalAmount,
          discount_amount: discountAmount || 0,
          coupon_id: couponId || null,
          status: 'pending',
          payment_status: 'pending',
          items: items,
          expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create initial tracking entry
    const { error: trackingError } = await supabase
      .from('order_tracking')
      .insert([
        {
          order_id: order.id,
          status: 'pending',
          message: 'Order placed successfully',
          location: 'Processing Center'
        }
      ]);

    if (trackingError) throw trackingError;

    return order;
  } catch (error) {
    throw error;
  }
};

export const updateOrderPayment = async (
  orderId: string,
  paymentId: string,
  paymentStatus: 'completed' | 'failed'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_id: paymentId,
        payment_status: paymentStatus,
        status: paymentStatus === 'completed' ? 'confirmed' : 'pending'
      })
      .eq('id', orderId);

    if (error) throw error;

    // Add tracking update
    if (paymentStatus === 'completed') {
      await supabase
        .from('order_tracking')
        .insert([
          {
            order_id: orderId,
            status: 'confirmed',
            message: 'Payment confirmed. Order is being processed.',
            location: 'Processing Center'
          }
        ]);
    }
  } catch (error) {
    throw error;
  }
};

export const getOrderWithItems = async (orderId: string) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        addresses(*),
        order_items(
          *,
          products(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    return order;
  } catch (error) {
    throw error;
  }
};