import { supabase } from '../lib/supabase';
import { User } from '../types';

export const signUp = async (phone: string, name: string): Promise<User> => {
  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      throw new Error('Phone number already registered');
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          phone,
          name,
          email: null
        }
      ])
      .select()
      .single();

    if (createError) throw createError;
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (phone: string): Promise<User> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      throw new Error('Phone number not registered. Please sign up first.');
    }

    return userData;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const signOut = (): void => {
  setCurrentUser(null);
  localStorage.removeItem('cart');
};