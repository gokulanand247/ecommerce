import { supabase } from '../lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
}

export interface CouponApplication {
  coupon_id: string;
  discount_amount: number;
  message: string;
}

export const applyCoupon = async (code: string, orderAmount: number): Promise<CouponApplication> => {
  try {
    const { data, error } = await supabase
      .rpc('apply_coupon', {
        p_code: code,
        p_order_amount: orderAmount
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Invalid coupon code');
    }

    return data[0];
  } catch (error) {
    throw error;
  }
};

export const getActiveCoupons = async (): Promise<Coupon[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const createCoupon = async (couponData: Partial<Coupon>): Promise<Coupon> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateCoupon = async (couponId: string, couponData: Partial<Coupon>): Promise<Coupon> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update(couponData)
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const recordCouponUsage = async (
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> => {
  try {
    await supabase.from('coupon_usage').insert([
      {
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount
      }
    ]);

    await supabase.rpc('increment', {
      table_name: 'coupons',
      row_id: couponId,
      column_name: 'usage_count'
    });
  } catch (error) {
    console.error('Error recording coupon usage:', error);
  }
};
