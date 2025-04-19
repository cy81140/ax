import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Log supabase configuration for debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:',
    !supabaseUrl ? 'EXPO_PUBLIC_SUPABASE_URL is missing' : '',
    !supabaseAnonKey ? 'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing' : ''
  );
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl.substring(0, 20) + '...');
}

// Create and export a singleton Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Helper function to check if a user session is valid
export const checkSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error.message);
      return { valid: false, error };
    }
    
    const { session } = data;
    const valid = !!session && !!session.user;
    console.log('Session check:', valid ? 'Valid session' : 'No active session');
    return { valid, session };
  } catch (error) {
    console.error('Failed to check session:', error);
    return { valid: false, error };
  }
};

// Helper to log Supabase API errors more clearly
export const logSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error (${context}):`, {
    message: error?.message || 'Unknown error',
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status
  });
  return error;
}; 