import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/services';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      
      if (session?.user) {
        // Check if user exists in our users table
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (checkError && checkError.code === 'PGRST116') {
          // User doesn't exist in our users table yet, create profile
          console.log('Creating user profile after auth');
          await createUserProfile(session.user.id, session.user.email || '', session.user.user_metadata?.username || 'user');
        }
        
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (userId: string, email: string, username: string) => {
    try {
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: userId,
          email,
          username,
        },
      ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      return false;
    }
  };

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authUser) throw new Error('Failed to create user');

    // Only create user profile if email confirmation is not required
    // Otherwise, it will be created when they confirm their email
    if (!authUser.identities || authUser.identities.length === 0 || !authUser.identities[0].identity_data?.email_confirmed_at) {
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: authUser.id,
          email,
          username,
        },
      ]);

      if (profileError) {
        console.error('Error creating profile during signup:', profileError);
        await supabase.auth.signOut();
        throw profileError;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 