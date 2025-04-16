import { supabase } from './supabase';
import { User } from '../types/services';
import { logActivity } from './activity';

export const userService = {
  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
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
  }
}; 