import { supabase } from './supabase';
import { Post, User, Comment } from '../types/services';

// Update to match database enum values
export type ActivityType = 'new_post' | 'new_comment' | 'like' | 'follow' | 'ban' | 'unban' | 'delete_post' | 'report' | 'create_poll' | 'vote_poll' | 'mention' | 'reply' | 'repost';

// Mapping function to convert old activity types to the new database-aligned ones
export function mapLegacyActivityType(legacyType: string): ActivityType {
  const mappings: Record<string, ActivityType> = {
    'post': 'new_post',
    'comment': 'new_comment',
    'like': 'like',
    'follow': 'follow',
    'mention': 'mention',
    'reply': 'reply',
    'repost': 'repost',
    'create': 'new_post',
    'create_post': 'new_post'
  };
  
  return (mappings[legacyType] || legacyType) as ActivityType;
}

// Mapping function to get display-friendly descriptions of activities
export function getActivityDescription(action_type: ActivityType, username: string = 'Someone'): string {
  switch (action_type) {
    case 'new_post':
      return `${username} created a new post`;
    case 'new_comment':
      return `${username} commented on a post`;
    case 'like':
      return `${username} liked a post`;
    case 'follow':
      return `${username} started following you`;
    case 'mention':
      return `${username} mentioned you in a post`;
    case 'reply':
      return `${username} replied to you`;
    case 'repost':
      return `${username} reposted your content`;
    case 'create_poll':
      return `${username} created a poll`;
    case 'vote_poll':
      return `${username} voted on a poll`;
    default:
      return `${username} performed an action`;
  }
}

export interface Activity {
  id: string;
  action_type: ActivityType;
  actor_id: string;
  target_id: string;
  target_type?: string;
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
        target_type,
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

  async getActivitiesForUser(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        action_type,
        actor_id,
        target_id,
        target_type,
        created_at,
        user:users!actor_id(id, username, profile_picture)
      `)
      .eq('target_id', userId)
      .eq('target_type', 'user')
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
        target_type,
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
        target_type,
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
        target_type,
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

// Get notifications for a specific user (activities where they are the target)
export const getUserNotifications = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        action_type,
        created_at,
        actor_id,
        target_id,
        target_type,
        user:users!actor_id(id, username, profile_picture)
      `)
      .eq('target_id', userId)
      .eq('target_type', 'user')
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
    console.error('Error fetching user notifications:', error);
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
  action_type: string, // Accept string to handle legacy type names
  targetId: string,
  target_type: string
): Promise<{ data: Activity | null; error: any }> => {
  try {
    // Map legacy activity types to new database-aligned ones
    const mappedActivityType = mapLegacyActivityType(action_type);
    
    const { data: supabaseData, error } = await supabase
      .from('activities')
      .insert([
        {
          actor_id: actorId,
          action_type: mappedActivityType,
          target_id: targetId,
          target_type,
        },
      ])
      .select(`
        id,
        action_type,
        actor_id,
        target_id,
        target_type,
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