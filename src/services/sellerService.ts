import { supabase } from '../lib/supabase';

export interface Seller {
  seller_id: string;
  username: string;
  shop_name: string;
  email: string;
  is_verified: boolean;
  profile_completed: boolean;
}

export interface SellerProfile {
  shop_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const sellerLogin = async (username: string, password: string): Promise<Seller> => {
  try {
    const { data, error } = await supabase
      .rpc('verify_seller_login', {
        p_username: username,
        p_password: password
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Invalid username or password');
    }

    return data[0];
  } catch (error) {
    throw error;
  }
};

export const updateSellerProfile = async (
  sellerId: string,
  profile: SellerProfile
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sellers')
      .update({
        ...profile,
        profile_completed: true
      })
      .eq('id', sellerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const requestVerification = async (sellerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sellers')
      .update({
        verification_requested_at: new Date().toISOString()
      })
      .eq('id', sellerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const getSellerProducts = async (sellerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getSellerOrders = async (sellerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          *,
          users(name, email, phone),
          addresses(*)
        ),
        products!inner(seller_id)
      `)
      .eq('products.seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getAllSellers = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const verifySeller = async (sellerId: string, adminId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sellers')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: adminId
      })
      .eq('id', sellerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const toggleSellerStatus = async (sellerId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sellers')
      .update({ is_active: isActive })
      .eq('id', sellerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
