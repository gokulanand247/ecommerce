import { supabase } from '../lib/supabase';
import { User } from '../types';

export const signUp = async (email: string, password: string, name: string, phone: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          name,
          phone
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user data received');

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          phone
        }
      ])
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (existingUser) return existingUser;
      }
      throw createError;
    }
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user data received');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            name: data.user.user_metadata?.name || null,
            phone: data.user.user_metadata?.phone || null
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newUser;
    }

    return userData;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return { success: true, message: 'Password reset link sent to your email' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send reset link'
    };
  }
};

export const updatePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update password'
    };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    return userData;
  } catch (error) {
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};