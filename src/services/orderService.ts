import { supabase } from '../lib/supabase';
import { CartItem, Address, Order } from '../types';

interface OrderItem {
  product_id: string;
  seller_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export const createOrderWithRazorpay = async (
  userId: string,
  cartItems: CartItem[],
  address: Address,
  totalAmount: number,
  couponId?: string,
  discountAmount?: number,
  subtotal?: number,
  shippingFee?: number
): Promise<{ order_id: string; razorpay_order_id: string }> => {
  try {
    const productIds = cartItems.map(item => item.id);

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, seller_id, price, original_price')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

    const orderItems: OrderItem[] = cartItems.map(item => {
      const productData = productMap.get(item.id);
      if (!productData || !productData.seller_id) {
        throw new Error(`Product ${item.id} not found or has no seller`);
      }
      return {
        product_id: item.id,
        seller_id: productData.seller_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      };
    });

    const finalSubtotal = subtotal || orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const finalShipping = shippingFee || 0;
    const finalDiscount = discountAmount || 0;
    const finalTotal = finalSubtotal + finalShipping - finalDiscount;

    const itemsJson = orderItems.map(item => ({
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    }));

    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase.rpc('create_order_with_payment', {
      p_user_id: userId,
      p_address_id: address.id,
      p_items: JSON.stringify(itemsJson),
      p_subtotal: finalSubtotal,
      p_shipping_fee: finalShipping,
      p_discount: finalDiscount,
      p_total: finalTotal,
      p_coupon_id: couponId || null,
      p_razorpay_order_id: razorpayOrderId
    });

    if (error) {
      console.error('Order creation error:', error);
      throw error;
    }

    return {
      order_id: data,
      razorpay_order_id: razorpayOrderId
    };
  } catch (error) {
    console.error('Create order exception:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  status: 'completed' | 'failed'
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_payment_status', {
      p_order_id: orderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: razorpaySignature,
      p_status: status
    });

    if (error) throw error;
  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
};

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
    const productIds = cartItems.map(item => item.id);

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, seller_id, original_price')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

    const allOrderItems: OrderItem[] = cartItems.map(item => {
      const productData = productMap.get(item.id);
      if (!productData || !productData.seller_id) {
        throw new Error(`Product ${item.id} not found or has no seller`);
      }
      return {
        product_id: item.id,
        seller_id: productData.seller_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      };
    });

    const finalSubtotal = subtotal || allOrderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const finalDiscount = discountAmount || 0;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          address_id: address.id,
          subtotal: finalSubtotal,
          discount: finalDiscount,
          shipping_fee: 0,
          total: totalAmount,
          coupon_id: couponId || null,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cod'
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(orderError.message || 'Failed to create order');
    }

    if (!order) {
      throw new Error('Order was not created');
    }

    const orderItemsToInsert = allOrderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      throw new Error('Failed to create order items');
    }

    await supabase
      .from('order_tracking')
      .insert([
        {
          order_id: order.id,
          status: 'pending',
          message: 'Order placed successfully',
          location: 'Order Received'
        }
      ]);

    return order;
  } catch (error) {
    console.error('Create order exception:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create order');
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
        razorpay_payment_id: paymentId,
        payment_status: paymentStatus,
        status: paymentStatus === 'completed' ? 'confirmed' : 'pending'
      })
      .eq('id', orderId);

    if (error) throw error;

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
          products(*, sellers(shop_name))
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

export const getUserOrders = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        addresses(*),
        order_items(
          *,
          products(name, image_url, images, sellers(shop_name))
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getOrderTracking = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true});

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};
