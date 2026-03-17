import { supabase } from './supabase';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return await supabase.auth.signOut();
}
