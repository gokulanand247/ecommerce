import { supabase } from '../lib/supabase';

export interface TodaysDeal {
  id: string;
  product_id: string;
  discount_percentage: number;
  deal_price: number;
  original_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  product?: any;
}

export const getActiveDeals = async (): Promise<any[]> => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('todays_deals')
      .select(`
        *,
        products (
          id,
          name,
          description,
          price,
          mrp,
          image_url,
          images,
          category,
          sizes,
          colors,
          stock,
          seller_id,
          sellers (shop_name)
        )
      `)
      .eq('is_active', true)
      .lte('valid_from', now)
      .gte('valid_until', now)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getAllDeals = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('todays_deals')
      .select(`
        *,
        products(
          id,
          name,
          image_url,
          price,
          mrp,
          category
        )
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const createDeal = async (dealData: any): Promise<TodaysDeal> => {
  try {
    const deal = {
      product_id: dealData.product_id,
      discount_percentage: dealData.discount_percentage,
      valid_from: dealData.valid_from || new Date().toISOString(),
      valid_until: dealData.valid_until,
      is_active: dealData.is_active !== undefined ? dealData.is_active : true,
      sort_order: dealData.sort_order || 0
    };

    const { data, error } = await supabase
      .from('todays_deals')
      .insert([deal])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateDeal = async (dealId: string, dealData: Partial<TodaysDeal>): Promise<TodaysDeal> => {
  try {
    const { data, error } = await supabase
      .from('todays_deals')
      .update(dealData)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteDeal = async (dealId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('todays_deals')
      .delete()
      .eq('id', dealId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
