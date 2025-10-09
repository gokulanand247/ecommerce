import { supabase } from '../lib/supabase';

export interface TodaysDeal {
  id: string;
  product_id: string;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const getActiveDeals = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_todays_active_deals');

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

export const createDeal = async (dealData: Partial<TodaysDeal>): Promise<TodaysDeal> => {
  try {
    const { data, error } = await supabase
      .from('todays_deals')
      .insert([dealData])
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
