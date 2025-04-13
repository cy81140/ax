import { supabase } from './supabase';

export interface ActivityItem {
  id: string;
  type: 'new_post' | 'new_comment' | 'like' | 'follow' | 'ban' | 'unban' | 'delete_post' | 'report' | 'create_poll' | 'vote_poll';
  created_at: string;
  actor_id: string;
  actor: {
    username: string;
    profile_picture: string | null;
  };
  target_id: string; // post_id, comment_id, or user_id depending on type
  target_content?: string;
  target_user?: {
    username: string;
  };
}

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
    const formattedData: ActivityItem[] = data.map((item: any) => {
      const actorData = Array.isArray(item.users) ? item.users[0] : item.users;
      const targetUserData = item.target_user 
        ? (Array.isArray(item.target_user) ? item.target_user[0] : item.target_user)
        : undefined;
        
      return {
        id: item.id,
        type: item.type,
        created_at: item.created_at,
        actor_id: item.actor_id,
        actor: {
          username: actorData?.username || 'Unknown user',
          profile_picture: actorData?.profile_picture || null,
        },
        target_id: item.target_id,
        target_content: item.target_content,
        ...(targetUserData && {
          target_user: {
            username: targetUserData.username || 'Unknown user',
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
    const formattedData: ActivityItem[] = data.map((item: any) => {
      const actorData = Array.isArray(item.users) ? item.users[0] : item.users;
      const targetUserData = item.target_user 
        ? (Array.isArray(item.target_user) ? item.target_user[0] : item.target_user)
        : undefined;
        
      return {
        id: item.id,
        type: item.type,
        created_at: item.created_at,
        actor_id: item.actor_id,
        actor: {
          username: actorData?.username || 'Unknown user',
          profile_picture: actorData?.profile_picture || null,
        },
        target_id: item.target_id,
        target_content: item.target_content,
        ...(targetUserData && {
          target_user: {
            username: targetUserData.username || 'Unknown user',
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
  type: ActivityItem['type'],
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