import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/services';
import { Session } from '@supabase/supabase-js';
import { provinceChatService } from '../services/provinceChatService';

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
        // Ensure subscriptions are cleaned up on logout/session expiry via listener
        await provinceChatService.unsubscribeFromAllProvinceChats();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (userId: string, email: string, username: string): Promise<boolean> => {
    try {
      console.log(`Creating/updating user profile for ${userId} with email: ${email}, username: ${username}`);
      
      // Get current user to verify authentication
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        console.error('No authenticated user found when creating profile');
        return false;
      }
      
      // Ensure we're only creating a profile for the current authenticated user (RLS requirement)
      if (authData.user.id !== userId) {
        console.error('Auth mismatch: Cannot create profile for another user');
        return false;
      }
      
      // Try inserting first - RLS policies should allow this for the current user
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email,
          username,
        }]);
        
      // If insert succeeds, we're done
      if (!insertError) {
        console.log('Successfully created new user profile');
        return true;
      }
      
      // If we get duplicate key error, the profile already exists
      if (insertError.code === '23505') {
        console.log('Profile already exists. Updating...');
        
        // Try updating the existing profile
        const { error: updateError } = await supabase
          .from('users')
          .update({ username, email })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating existing profile:', updateError);
          return false;
        }
        
        console.log('Successfully updated existing profile');
        return true;
      }
      
      // For other errors, log and return false
      console.error('Error creating user profile:', insertError);
      return false;
    } catch (error) {
      console.error('Failed to create/update user profile:', error);
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

      if (error) {
        // If user doesn't exist in our database, create a profile
        if (error.code === 'PGRST116') {
          console.log('User not found in users table, creating profile during fetch');
          
          // Get user details from auth
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const email = authData.user.email || `${userId}@placeholder.com`;
            const username = authData.user.user_metadata?.username || `user_${Date.now().toString().slice(-6)}`;
            
            const success = await createUserProfile(userId, email, username);
            if (success) {
              // Try fetching again
              const { data: newData, error: newError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (newError) {
                console.error('Error fetching newly created user:', newError);
                setUser(null);
              } else {
                setUser(newData);
              }
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          console.error('Error fetching user:', error);
          setUser(null);
        }
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('Exception fetching user:', error);
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
    // Unsubscribe from all province chat channels first
    await provinceChatService.unsubscribeFromAllProvinceChats();
    // Then sign out from Supabase auth
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Even if Supabase signout fails, we cleared local state via the listener
      console.error("Error signing out from Supabase Auth:", error);
      // Depending on desired behavior, you might still want to throw the error
      // throw error; 
    } else {
      console.log('Successfully signed out and unsubscribed from channels.');
    }
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