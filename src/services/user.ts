import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../utils/errorHandling';
import { uploadFile, deleteFile, StorageBucket } from './upload';
import { User } from '../types/services';
import { logActivity } from './activity';

// User profile types
export type UserProfile = {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  is_public: boolean;
};

export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return await handleSupabaseError(error, 'getting current user');
    }
    
    return {
      data: user,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting current user');
  }
}

/**
 * Get a user profile by ID
 * @param userId The user ID to get the profile for
 * @returns The user profile or error
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      return await handleSupabaseError(error, 'getting user profile');
    }
    
    return {
      data: data as UserProfile,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting user profile');
  }
}

/**
 * Get a user profile by username
 * @param username The username to get the profile for
 * @returns The user profile or error
 */
export async function getUserProfileByUsername(username: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      return await handleSupabaseError(error, 'getting user profile by username');
    }
    
    return {
      data: data as UserProfile,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting user profile by username');
  }
}

/**
 * Check if a username is available
 * @param username The username to check
 * @returns Boolean indicating if the username is available
 */
export async function isUsernameAvailable(username: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username);
    
    if (error) {
      return await handleSupabaseError(error, 'checking username availability');
    }
    
    return {
      data: { available: data.length === 0 },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'checking username availability');
  }
}

/**
 * Update a user profile
 * @param userId The user ID to update
 * @param updates The profile updates to apply
 * @returns The updated profile or error
 */
export async function updateUserProfile(userId: string, updates: UserProfileUpdate) {
  try {
    // First check if this user exists
    const { data: existingUser, error: userError } = await getUserProfile(userId);
    
    if (userError) {
      return { data: null, error: userError };
    }
    
    if (!existingUser) {
      return {
        data: null,
        error: {
          message: 'User not found',
          status: 404
        }
      };
    }
    
    // If updating username, check availability
    if (updates.username && updates.username !== existingUser.username) {
      const { data: usernameCheck, error: usernameError } = await isUsernameAvailable(updates.username);
      
      if (usernameError) {
        return { data: null, error: usernameError };
      }
      
      if (!usernameCheck.available) {
        return {
          data: null,
          error: {
            message: 'Username is already taken',
            status: 400
          }
        };
      }
    }
    
    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();
    
    if (error) {
      return await handleSupabaseError(error, 'updating user profile');
    }
    
    return {
      data: data as UserProfile,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'updating user profile');
  }
}

/**
 * Upload a user avatar
 * @param userId The user ID to upload an avatar for
 * @param file The avatar image file
 * @returns The updated profile with new avatar URL or error
 */
export async function uploadUserAvatar(userId: string, file: File) {
  try {
    // Get the current user profile
    const { data: profile, error: profileError } = await getUserProfile(userId);
    
    if (profileError) {
      return { data: null, error: profileError };
    }
    
    // Delete the old avatar if it exists
    if (profile.avatar_url) {
      const oldAvatarPath = profile.avatar_url.split('/').pop() || '';
      if (oldAvatarPath) {
        await deleteFile(oldAvatarPath, 'avatars');
      }
    }
    
    // Upload the new avatar
    const { data: uploadData, error: uploadError } = await uploadFile(file, 'avatars', userId);
    
    if (uploadError) {
      return { data: null, error: uploadError };
    }
    
    // Update the user profile with the new avatar URL
    const { data: updatedProfile, error: updateError } = await updateUserProfile(userId, {
      avatar_url: uploadData.url
    });
    
    if (updateError) {
      return { data: null, error: updateError };
    }
    
    return {
      data: updatedProfile,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'uploading user avatar');
  }
}

/**
 * Search for users by username or full name
 * @param query The search query
 * @param limit Optional result limit (default 10)
 * @param offset Optional pagination offset
 * @returns Array of matching user profiles
 */
export async function searchUsers(query: string, limit: number = 10, offset: number = 0) {
  try {
    // Ensure query is at least 3 characters
    if (query.length < 3) {
      return {
        data: [],
        error: {
          message: 'Search query must be at least 3 characters',
          status: 400
        }
      };
    }
    
    // Search in both username and full_name
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .eq('is_public', true)
      .order('username', { ascending: true })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (error) {
      return await handleSupabaseError(error, 'searching users');
    }
    
    return {
      data: data as UserProfile[],
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'searching users');
  }
}

/**
 * Get user followers
 * @param userId The user ID to get followers for
 * @param limit Optional result limit (default 20)
 * @param offset Optional pagination offset
 * @returns Array of user profiles who follow the specified user
 */
export async function getUserFollowers(userId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('follower_id, profiles!followers_follower_id_fkey(*)')
      .eq('following_id', userId)
      .range(offset, offset + limit - 1);
    
    if (error) {
      return await handleSupabaseError(error, 'getting user followers');
    }
    
    // Transform the data to extract user profiles
    const followers = data.map(item => {
      // Ensure we're properly extracting the profiles data
      if (Array.isArray(item.profiles)) {
        return item.profiles[0] as UserProfile;
      }
      return item.profiles as UserProfile;
    }).filter(Boolean);
    
    return {
      data: followers,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting user followers');
  }
}

/**
 * Get users that a user is following
 * @param userId The user ID to get following for
 * @param limit Optional result limit (default 20)
 * @param offset Optional pagination offset
 * @returns Array of user profiles the specified user is following
 */
export async function getUserFollowing(userId: string, limit: number = 20, offset: number = 0) {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('following_id, profiles!followers_following_id_fkey(*)')
      .eq('follower_id', userId)
      .range(offset, offset + limit - 1);
    
    if (error) {
      return await handleSupabaseError(error, 'getting user following');
    }
    
    // Transform the data to extract user profiles
    const following = data.map(item => {
      // Ensure we're properly extracting the profiles data
      if (Array.isArray(item.profiles)) {
        return item.profiles[0] as UserProfile;
      }
      return item.profiles as UserProfile;
    }).filter(Boolean);
    
    return {
      data: following,
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting user following');
  }
}

/**
 * Follow a user
 * @param followerId The user ID who wants to follow
 * @param followingId The user ID to follow
 * @returns Success status or error
 */
export async function followUser(followerId: string, followingId: string) {
  try {
    // Prevent following yourself
    if (followerId === followingId) {
      return {
        data: null,
        error: {
          message: 'You cannot follow yourself',
          status: 400
        }
      };
    }
    
    // Check if already following
    const { data: existing, error: checkError } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    
    if (checkError) {
      return await handleSupabaseError(checkError, 'checking follow status');
    }
    
    if (existing && existing.length > 0) {
      return {
        data: { already_following: true },
        error: null
      };
    }
    
    // Create the follow relationship
    const { error } = await supabase
      .from('followers')
      .insert([
        { follower_id: followerId, following_id: followingId }
      ]);
    
    if (error) {
      return await handleSupabaseError(error, 'following user');
    }
    
    return {
      data: { success: true },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'following user');
  }
}

/**
 * Unfollow a user
 * @param followerId The user ID who wants to unfollow
 * @param followingId The user ID to unfollow
 * @returns Success status or error
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    
    if (error) {
      return await handleSupabaseError(error, 'unfollowing user');
    }
    
    return {
      data: { success: true },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'unfollowing user');
  }
}

/**
 * Check if a user is following another user
 * @param followerId The user ID to check if following
 * @param followingId The user ID to check if being followed
 * @returns Boolean indicating follow status
 */
export async function isFollowing(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    
    if (error) {
      return await handleSupabaseError(error, 'checking follow status');
    }
    
    return {
      data: { is_following: data.length > 0 },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'checking follow status');
  }
}

/**
 * Get follower and following counts for a user
 * @param userId The user ID to get counts for
 * @returns The follower and following counts
 */
export async function getUserFollowCounts(userId: string) {
  try {
    // Get follower count
    const { data: followers, error: followerError } = await supabase
      .from('followers')
      .select('count', { count: 'exact', head: true })
      .eq('following_id', userId);
    
    if (followerError) {
      return await handleSupabaseError(followerError, 'getting follower count');
    }
    
    // Get following count
    const { data: following, error: followingError } = await supabase
      .from('followers')
      .select('count', { count: 'exact', head: true })
      .eq('follower_id', userId);
    
    if (followingError) {
      return await handleSupabaseError(followingError, 'getting following count');
    }
    
    return {
      data: {
        follower_count: followers,
        following_count: following
      },
      error: null
    };
  } catch (error) {
    return await handleSupabaseError(error, 'getting user follow counts');
  }
}

export const userService = {
  async getProfile(userId: string): Promise<{ data: User | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
  
      if (error) {
        // Handle "no rows found" case specially
        if (error.code === 'PGRST116') {
          return { data: null, error: null };
        }
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return { 
        data: null, 
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch user profile',
          details: error
        }
      };
    }
  },

  async updateProfile(userId: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    try {
      console.log(`Updating profile for user ${userId} with:`, updates);
      
      // First ensure we're only updating our own profile (RLS check)
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || authData.user.id !== userId) {
        throw new Error('You can only update your own profile');
      }
      
      // First try a direct update and see if any rows are affected
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      // If the update succeeds, return the updated data
      if (!updateError) {
        console.log('Profile updated successfully');
        return updateData;
      }
      
      // If we get a "no rows returned" error, the profile might not exist yet
      if (updateError.code === 'PGRST116') {
        console.log(`User ${userId} not found in users table. Trying upsert...`);
        
        // Use upsert to handle both insert and update cases
        const { data: upsertData, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            ...updates,
            // If username is not in updates, generate one
            username: updates.username || `user_${Date.now()}`,
            // If email is not in updates, use a placeholder
            email: updates.email || `${userId}@placeholder.com`
          })
          .select()
          .single();
        
        if (upsertError) {
          console.error('Upsert error:', upsertError);
          
          // If there's an RLS policy error, try a more direct approach
          if (upsertError.code === '42501') { // RLS policy violation
            console.log('RLS policy violation. Retrying with explicit auth...');
            
            // For RLS policy errors, try direct insert first
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                ...updates,
                username: updates.username || `user_${Date.now()}`,
                email: updates.email || `${userId}@placeholder.com`
              })
              .select()
              .single();
              
            if (!insertError) {
              return insertData;
            }
            
            // If insert fails with duplicate key, try update once more
            if (insertError.code === '23505') {
              console.log('Profile exists (duplicate key). Retrying update...');
              
              const { data: retryData, error: retryError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
                
              if (retryError) throw retryError;
              return retryData;
            }
            
            throw insertError;
          }
          
          // For any other error with upsert, throw it
          throw upsertError;
        }
        
        return upsertData;
      }
      
      // For any other error, throw it
      throw updateError;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('followers')
      .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) throw error;

    // Log activity
    try {
        await logActivity(followerId, 'follow', followingId, 'user');
    } catch (activityError) {
        console.error("Failed to log follow activity:", activityError);
        // Decide if failure to log should throw or just be logged
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('followers')
      .select('follower:users!follower_id(*)')
      .eq('following_id', userId);

    if (error) throw error;
    return data?.map((item: any) => item.follower) || [];
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('followers')
      .select('following:users!following_id(*)')
      .eq('follower_id', userId);

    if (error) throw error;
    return data?.map((item: any) => item.following) || [];
  },

  // Mute a user
  async muteUser(userId: string, mutedUserId: string): Promise<void> {
    const { error } = await supabase
      .from('muted_users')
      .insert({
        user_id: userId,
        muted_user_id: mutedUserId,
      });

    if (error) throw error;
  },

  // Unmute a user
  async unmuteUser(userId: string, mutedUserId: string): Promise<void> {
    const { error } = await supabase
      .from('muted_users')
      .delete()
      .eq('user_id', userId)
      .eq('muted_user_id', mutedUserId);

    if (error) throw error;
  },

  // Get list of muted users for a user
  async getMutedUsers(userId: string): Promise<{ muted_user_id: string; muted_users: User }[]> {
    const { data, error } = await supabase
      .from('muted_users')
      .select(`
        muted_user_id,
        muted_users:users!muted_user_id(id, username, profile_picture)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Map the result to ensure muted_users is a single object
    const mappedData = (data || []).map(item => ({
        muted_user_id: item.muted_user_id,
        // Extract the first element if muted_users is an array
        muted_users: (Array.isArray(item.muted_users) ? item.muted_users[0] : item.muted_users) as User
    })).filter(item => item.muted_users); // Ensure muted_users is not null/undefined

    return mappedData;
  },

  /**
   * Creates or updates a user profile with simplified input
   * Useful for initial profile setup
   */
  async createOrUpdateProfile(userId: string, email: string, username: string): Promise<{ data: User | null; error: any }> {
    try {
      console.log(`Creating/updating profile for user ${userId} with email ${email} and username ${username}`);
      
      // First check if the user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', fetchError);
        return { 
          data: null, 
          error: {
            message: `Failed to check for existing user: ${fetchError.message}`,
            code: fetchError.code,
            details: fetchError
          }
        };
      }
      
      // If user exists, update
      if (existingUser) {
        console.log(`User ${userId} exists, updating profile...`);
        const user = await this.updateProfile(userId, { email, username });
        return { data: user, error: null };
      }
      
      // User doesn't exist, create new profile directly
      console.log(`User ${userId} doesn't exist, creating new profile...`);
      try {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email,
            username,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          
          // Check for specific constraints
          if (insertError.code === '23505') { // Unique violation
            if (insertError.message.includes('users_username_key')) {
              return { 
                data: null, 
                error: {
                  message: `Username "${username}" is already taken. Please choose another.`,
                  code: 'USERNAME_TAKEN',
                  details: insertError
                }
              };
            }
            if (insertError.message.includes('users_email_key')) {
              return { 
                data: null, 
                error: {
                  message: `Email "${email}" is already registered. Please login instead.`,
                  code: 'EMAIL_TAKEN',
                  details: insertError
                }
              };
            }
          }
          
          // Fall back to updateProfile if insert fails (might be a race condition)
          console.log('Insert failed, trying updateProfile as fallback...');
          const user = await this.updateProfile(userId, { email, username });
          return { data: user, error: null };
        }
        
        return { data: newUser, error: null };
      } catch (insertCatchError) {
        console.error('Exception during profile creation:', insertCatchError);
        
        // Last resort fallback
        console.log('Insert exception, trying updateProfile as final fallback...');
        try {
          const user = await this.updateProfile(userId, { email, username });
          return { data: user, error: null };
        } catch (updateError) {
          return { 
            data: null, 
            error: {
              message: `All profile creation methods failed: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
              code: 'PROFILE_CREATION_FAILED',
              details: updateError
            }
          };
        }
      }
    } catch (error) {
      console.error('Unhandled error in createOrUpdateProfile:', error);
      return { 
        data: null, 
        error: {
          message: error instanceof Error ? error.message : 'Failed to create or update profile',
          code: 'UNHANDLED_ERROR',
          details: error
        }
      };
    }
  }
}; 