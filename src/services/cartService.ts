import { supabase } from '../lib/supabase';
import { CartItem } from '../types';

export const saveCartToDatabase = async (userId: string, cartItems: CartItem[]) => {
  try {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (cartItems.length === 0) return;

    const cartData = cartItems.map(item => ({
      user_id: userId,
      product_id: item.id,
      quantity: item.quantity,
      selected_size: item.selectedSize || 'One Size',
      selected_color: item.selectedColor || 'Default'
    }));

    const { error } = await supabase
      .from('cart_items')
      .insert(cartData);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving cart:', error);
    throw error;
  }
};

export const loadCartFromDatabase = async (userId: string): Promise<CartItem[]> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item.products,
      quantity: item.quantity,
      selectedSize: item.selected_size,
      selectedColor: item.selected_color
    }));
  } catch (error) {
    console.error('Error loading cart:', error);
    return [];
  }
};

export const updateCartItemInDatabase = async (
  userId: string,
  productId: string,
  size: string,
  color: string,
  quantity: number
) => {
  try {
    if (quantity <= 0) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('selected_size', size)
        .eq('selected_color', color);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: productId,
          selected_size: size,
          selected_color: color,
          quantity: quantity
        }, {
          onConflict: 'user_id,product_id,selected_size,selected_color'
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

export const clearCartFromDatabase = async (userId: string) => {
  try {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};
