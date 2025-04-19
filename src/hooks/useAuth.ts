import { useState, useEffect } from 'react';
import { supabase, logSupabaseError, checkSession } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('useAuth: Initializing auth state...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logSupabaseError(error, 'useAuth.getSession');
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('useAuth: Session found for user:', session.user.id);
        } else {
          console.log('useAuth: No active session found');
        }
      } catch (err) {
        console.error('useAuth: Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('useAuth: Auth state changed, event:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('useAuth: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('useAuth: Attempting signup for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        logSupabaseError(error, 'useAuth.signUp');
        throw error;
      }

      if (data.user) {
        console.log('useAuth: Creating user profile for new signup');
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              username,
            },
          ]);

        if (profileError) {
          logSupabaseError(profileError, 'useAuth.signUp.createProfile');
          throw profileError;
        }
        
        console.log('useAuth: Signup and profile creation successful');
      }

      return { data, error: null };
    } catch (error) {
      console.error('useAuth: Signup process failed:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('useAuth: Attempting signin for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logSupabaseError(error, 'useAuth.signIn');
        throw error;
      }
      
      console.log('useAuth: Signin successful');
      return { data, error: null };
    } catch (error) {
      console.error('useAuth: Signin failed:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) {
        logSupabaseError(error, 'useAuth.signOut');
        throw error;
      }
      console.log('useAuth: Signout successful');
      return { error: null };
    } catch (error) {
      console.error('useAuth: Signout failed:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}; 