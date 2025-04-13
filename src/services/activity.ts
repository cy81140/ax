import { supabase } from './supabase';
import { Post, User, Comment } from '../types/services';

export type ActivityType = 'post' | 'comment' | 'like' | 'follow';

export interface Activity {
  id: string;
  type: ActivityType;
  user_id: string;
  target_id: string;
  created_at: string;
  post?: Post;
  comment?: Comment;
  user?: User;
}

export const activityService = {
  async getActivityFeed(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        post:posts(*),
        comment:comments(*),
        user:users(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createActivity(activity: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data;
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
export const getActivityFeed = async (limit = 20, offset = 0) => {
  try {
    // Perform the query for recent activity
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        created_at,
        actor_id,
        users!actor_id(username, profile_picture),
        target_id,
        target_content,
        target_user:target_user_id(username)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format the data to match our expected types
    const formattedData: Activity[] = data.map((item: any) => {
      const actorData = Array.isArray(item.users) ? item.users[0] : item.users;
      const targetUserData = item.target_user 
        ? (Array.isArray(item.target_user) ? item.target_user[0] : item.target_user)
        : undefined;
        
      return {
        id: item.id,
        type: item.type,
        created_at: item.created_at,
        user_id: item.actor_id,
        target_id: item.target_id,
        user: {
          id: item.actor_id,
          username: actorData?.username || 'Unknown user',
          profile_picture: actorData?.profile_picture || null,
          created_at: item.created_at,
          email: '',
        },
        ...(targetUserData && {
          target_user: {
            id: item.target_user_id,
            username: targetUserData.username || 'Unknown user',
            created_at: item.created_at,
            email: '',
          }
        })
      };
    });

    return { data: formattedData, error: null };
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
        type,
        created_at,
        actor_id,
        users!actor_id(username, profile_picture),
        target_id,
        target_content,
        target_user:target_user_id(username)
      `)
      .eq('actor_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format the data to match our expected types
    const formattedData: Activity[] = data.map((item: any) => {
      const actorData = Array.isArray(item.users) ? item.users[0] : item.users;
      const targetUserData = item.target_user 
        ? (Array.isArray(item.target_user) ? item.target_user[0] : item.target_user)
        : undefined;
        
      return {
        id: item.id,
        type: item.type,
        created_at: item.created_at,
        user_id: item.actor_id,
        target_id: item.target_id,
        user: {
          id: item.actor_id,
          username: actorData?.username || 'Unknown user',
          profile_picture: actorData?.profile_picture || null,
          created_at: item.created_at,
          email: '',
        },
        ...(targetUserData && {
          target_user: {
            id: item.target_user_id,
            username: targetUserData.username || 'Unknown user',
            created_at: item.created_at,
            email: '',
          }
        })
      };
    });

    return { data: formattedData, error: null };
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
  type: ActivityType,
  targetId: string,
  targetContent?: string,
  targetUserId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          actor_id: actorId,
          type,
          target_id: targetId,
          target_content: targetContent,
          target_user_id: targetUserId,
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { data: null, error };
  }
}; 