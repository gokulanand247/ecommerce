import { supabase } from '../lib/supabase';

export interface Admin {
  admin_id: string;
  username: string;
  email: string;
  name: string;
}

export const adminLogin = async (username: string, password: string): Promise<Admin> => {
  try {
    const { data, error } = await supabase
      .rpc('verify_admin_login', {
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

export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    throw error;
  }
};

export const createProduct = async (productData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (productId: string, productData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const getAllOrders = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(name, email, phone),
        addresses(*),
        order_items(
          *,
          products(name, image_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};
