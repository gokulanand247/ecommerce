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

    if (error) {
      console.error('Login RPC error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Invalid username or password');
    }

    const admin = data[0];

    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.admin_id);

    return admin;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

export const getAdminAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_analytics')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw error;
  }
};

export const uploadProductImage = async (file: File, maxSizeMB: number = 2): Promise<string> => {
  try {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new Error(`Image size must be less than ${maxSizeMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  try {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 5 * 1024 * 1024;

    if (totalSize > maxTotalSize) {
      throw new Error(`Total images size must be less than 5MB. Current size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }

    if (files.length > 4) {
      throw new Error('Maximum 4 additional images allowed');
    }

    const uploadPromises = files.map(file => uploadProductImage(file, 2));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple images upload failed:', error);
    throw error;
  }
};

export const createProduct = async (productData: any): Promise<any> => {
  try {
    const productToInsert = {
      ...productData,
      images: productData.image_url ? [productData.image_url] : (productData.images || []),
      stock_quantity: productData.stock || productData.stock_quantity || 0
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productToInsert])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, productData: any): Promise<any> => {
  try {
    const productToUpdate = {
      ...productData,
      images: productData.image_url ? [productData.image_url] : (productData.images || []),
      stock_quantity: productData.stock || productData.stock_quantity || 0
    };

    const { data, error } = await supabase
      .from('products')
      .update(productToUpdate)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
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

    const statusMessages: Record<string, string> = {
      'pending': 'Order is pending confirmation',
      'confirmed': 'Order confirmed and being prepared',
      'processing': 'Order is being processed',
      'shipped': 'Order has been shipped',
      'out_for_delivery': 'Order is out for delivery',
      'delivered': 'Order has been delivered',
      'cancelled': 'Order has been cancelled',
      'returned': 'Order has been returned'
    };

    await supabase.from('order_tracking').insert([
      {
        order_id: orderId,
        status: status,
        message: statusMessages[status] || `Order status updated to ${status}`,
        location: 'Processing Center'
      }
    ]);
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
        coupons(code, discount_type, discount_value),
        order_items(
          *,
          products(name, image_url, seller_id)
        )
      `)
      .order('created_at', { ascending: false});

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};
