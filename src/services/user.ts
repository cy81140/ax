import { supabase } from './supabase';
import { User } from '../types/services';

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
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('user_follows')
      .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) throw error;
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('users!follower_id(*)')
      .eq('following_id', userId);

    if (error) throw error;
    return data?.map(item => item.users) || [];
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('users!following_id(*)')
      .eq('follower_id', userId);

    if (error) throw error;
    return data?.map(item => item.users) || [];
  }
};

export const getUserFollowing = async (userId: string): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following:following_id(*)')
      .eq('follower_id', userId);

    if (error) throw error;

    // Transform data structure to match User[]
    return data?.map(item => item.following) || [];
  } catch (error) {
    console.error('Error getting user following:', error);
    throw error;
  }
};

export const getUserFollowers = async (userId: string): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower:follower_id(*)')
      .eq('following_id', userId);

    if (error) throw error;

    // Transform data structure to match User[]
    return data?.map(item => item.follower) || [];
  } catch (error) {
    console.error('Error getting user followers:', error);
    throw error;
  }
}; 