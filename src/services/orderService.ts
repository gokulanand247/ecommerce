import { supabase } from '../lib/supabase';
import { CartItem, Address, Order } from '../types';

interface OrderItem {
  product_id: string;
  seller_id: string | null;
  quantity: number;
  price: number;
  mrp: number;
  selected_size: string;
  selected_color: string;
}

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
      .select('id, seller_id, mrp')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

    const allOrderItems: OrderItem[] = cartItems.map(item => {
      const productData = productMap.get(item.id);
      return {
        product_id: item.id,
        seller_id: productData?.seller_id || null,
        quantity: item.quantity,
        price: item.price,
        mrp: productData?.mrp || item.mrp || item.price,
        selected_size: item.selectedSize || 'M',
        selected_color: item.selectedColor || 'Default'
      };
    });

    const primarySellerId = allOrderItems.find(item => item.seller_id)?.seller_id || null;

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
          seller_id: primarySellerId,
          status: 'pending',
          payment_status: 'pending',
          expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      ...item,
      order_id: order.id
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

    if (couponId && discountAmount && discountAmount > 0) {
      await supabase.from('coupon_usage').insert([
        {
          coupon_id: couponId,
          user_id: userId,
          order_id: order.id,
          discount_amount: discountAmount
        }
      ]);

      await supabase.rpc('increment', {
        table_name: 'coupons',
        id: couponId,
        column_name: 'usage_count'
      }).catch(() => {
        supabase
          .from('coupons')
          .update({ usage_count: supabase.sql`usage_count + 1` })
          .eq('id', couponId);
      });
    }

    for (const item of allOrderItems) {
      await supabase
        .from('products')
        .update({
          stock: supabase.sql`stock - ${item.quantity}`,
          stock_quantity: supabase.sql`stock_quantity - ${item.quantity}`
        })
        .eq('id', item.product_id);
    }

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
        payment_id: paymentId,
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
          products(name, image_url, sellers(shop_name))
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
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};
