import { supabase } from './supabase';
import { Post, User, Comment } from '../types/services';

export type ActivityType = 'post' | 'comment' | 'like' | 'follow';

export interface Activity {
  id: string;
  action_type: ActivityType;
  actor_id: string;
  target_id: string;
  created_at: string;
  user: User;
}

export const activityService = {
  async getActivitiesByUserId(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        action_type,
        actor_id,
        target_id,
        created_at,
        user:users!actor_id(id, username, profile_picture)
      `)
      .eq('actor_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Map data to fix user array issue
    const mappedData = (data || []).map(item => ({
        ...item,
        user: (Array.isArray(item.user) ? item.user[0] : item.user) as User
    })).filter(item => item.user); // Ensure user exists
    return mappedData;
  },

  async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'user'> & { target_type: string }): Promise<Activity> {
    const { data: supabaseData, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select(`
        id,
        action_type,
        actor_id,
        target_id,
        created_at,
        user:users!actor_id(id, username, profile_picture)
      `)
      .single();

    if (error) throw error;
    if (!supabaseData) throw new Error("Failed to create or retrieve activity after insert.");

    // Map data to fix user array issue
    const userObject = Array.isArray(supabaseData.user) ? supabaseData.user[0] : supabaseData.user;
    const activityResult: Activity = {
        ...supabaseData,
        user: userObject as User
    };
    if (!activityResult.user) throw new Error("User data missing in created activity");
    return activityResult;
  },

  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
  }
};

// Get the main activity feed (recent posts, comments, likes)
export const getGlobalActivityFeed = async (limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        action_type,
        created_at,
        actor_id,
        target_id,
        user:users!actor_id(id, username, profile_picture)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Map data to fix user array issue
    const mappedData = (data || []).map(item => ({
        ...item,
        user: (Array.isArray(item.user) ? item.user[0] : item.user) as User
    })).filter(item => item.user);

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return { data: null, error };
  }
};

// Get activity for a specific user
export const getUserActivity = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        action_type,
        created_at,
        actor_id,
        target_id,
        user:users!actor_id(id, username, profile_picture)
      `)
      .eq('actor_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Map data to fix user array issue
    const mappedData = (data || []).map(item => ({
        ...item,
        user: (Array.isArray(item.user) ? item.user[0] : item.user) as User
    })).filter(item => item.user);

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return { data: null, error };
  }
};

// Subscribe to activity feed changes
export const subscribeToActivity = (callback: (payload: any) => void) => {
  return supabase
    .channel('activity_feed_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
      },
      callback
    )
    .subscribe();
};

// Log an activity
export const logActivity = async (
  actorId: string,
  action_type: ActivityType,
  targetId: string,
  target_type: string
): Promise<{ data: Activity | null; error: any }> => {
  try {
    const { data: supabaseData, error } = await supabase
      .from('activities')
      .insert([
        {
          actor_id: actorId,
          action_type,
          target_id: targetId,
          target_type,
        },
      ])
      .select(`
        id,
        action_type,
        actor_id,
        target_id,
        created_at,
        user:users!actor_id(id, username, profile_picture)
      `)
      .single();

    if (error) throw error;
    if (!supabaseData) return { data: null, error: null };

    const userObject = Array.isArray(supabaseData.user) ? supabaseData.user[0] : supabaseData.user;
    const activityResult: Activity = {
        ...supabaseData,
        user: userObject as User
    };

    if (!activityResult.user) {
        console.warn("LogActivity: User data missing or malformed in returned activity", supabaseData);
        return { data: null, error: new Error("User data missing in logged activity") };
    }

    return { data: activityResult, error: null };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { data: null, error };
  }
}; 