import { supabase } from '../lib/supabase';

export interface ReviewInput {
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  comment: string;
  images?: string[];
}

export const submitReview = async (review: ReviewInput) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        product_id: review.product_id,
        user_id: review.user_id,
        order_id: review.order_id || null,
        rating: review.rating,
        comment: review.comment,
        images: review.images || [],
        is_verified: !!review.order_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getProductReviews = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users(name, phone)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const canUserReview = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        orders!inner(user_id, status)
      `)
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'delivered')
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0) || false;
  } catch (error) {
    return false;
  }
};
