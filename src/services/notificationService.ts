import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  order_id: string;
  seller_id: string | null;
  type: 'new_order' | 'status_update';
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getSellerNotifications = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getAdminNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .is('seller_id', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getUnreadCount = async (sellerId?: string) => {
  try {
    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    } else {
      query = query.is('seller_id', null);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  } catch (error) {
    return 0;
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const markAllAsRead = async (sellerId?: string) => {
  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    } else {
      query = query.is('seller_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
