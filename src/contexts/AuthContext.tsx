import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/services';
import { Session } from '@supabase/supabase-js';
import { provinceChatService } from '../services/provinceChatService';
import { userService } from '../services/user';

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

  const manageUserProfile = async (authUserId: string, authEmail?: string, authUsername?: string) => {
    setLoading(true); 
    let userProfile: User | null = null;
    try {
      const { data: existingProfile, error: fetchError } = await userService.getProfile(authUserId);
      
      if (fetchError) {
        console.error('AuthContext: Error fetching profile during manage', fetchError);
      } else if (existingProfile) {
        userProfile = existingProfile;
        console.log('AuthContext: Found existing profile');
      } else {
        console.log('AuthContext: Profile not found, attempting creation...');
        const email = authEmail || `${authUserId}@placeholder.com`;
        const username = authUsername || `user_${Date.now().toString().slice(-6)}`;

        const { data: newProfile, error: createError } = await userService.createOrUpdateProfile(
          authUserId,
          email,
          username
        );

        if (createError) {
          console.error('AuthContext: Failed to create profile after auth', createError);
        } else {
          userProfile = newProfile;
          console.log('AuthContext: Successfully created profile');
        }
      }

      setUser(userProfile);

    } catch (e) {
        console.error("AuthContext: Unexpected error in manageUserProfile", e);
        setUser(null);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        manageUserProfile(session.user.id, session.user.email, session.user.user_metadata?.username);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      
      if (session?.user) {
        manageUserProfile(session.user.id, session.user.email, session.user.user_metadata?.username);
      } else {
        setUser(null);
        setLoading(false);
        
        // Only unsubscribe from all chats when explicitly signing out
        if (event === 'SIGNED_OUT') {
          await provinceChatService.unsubscribeFromAllProvinceChats();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
        setLoading(false);
        throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
            },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Sign up successful but no user data returned.');

        // Immediately create profile instead of waiting for auth state listener
        // This ensures the profile is created synchronously with signup
        const { error: profileError } = await userService.createOrUpdateProfile(
            signUpData.user.id,
            email,
            username
        );

        if (profileError) {
            console.error('Failed to create profile after signup:', profileError);
            throw new Error(`Account created but profile setup failed: ${profileError.message || 'Unknown error'}`);
        }

        console.log('Sign up and profile creation successful');

    } catch (error) {
        setLoading(false);
        throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await provinceChatService.unsubscribeFromAllProvinceChats();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase Auth:", error);
      }
      console.log('Sign out initiated, state cleanup via listener.');
    } catch(e) {
        console.error("Error during sign out process:", e);
    } finally {
        setLoading(false); 
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