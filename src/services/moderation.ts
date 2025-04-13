import { supabase } from './supabase';
import { logActivity } from './activity';
import { ActivityType } from '../types/services';

// Define report types
export type ReportType = 'user' | 'post' | 'comment' | 'message';

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  report_type: ReportType;
  reason: string;
  additional_info?: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes?: string;
}

// Define approved activity types for moderation
type ModerationActivityType = 'ban' | 'unban' | 'delete_post' | 'create_poll' | 'vote_poll';

// Submit a report
export const submitReport = async (
  reporterId: string,
  reportedId: string,
  reportType: ReportType,
  reason: string,
  additionalInfo?: string
) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        report_type: reportType,
        reason,
        additional_info: additionalInfo,
        resolved: false,
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting report:', error);
    return { data: null, error };
  }
};

// Get all unresolved reports (admin function)
export const getUnresolvedReports = async (limit = 50, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username, profile_picture),
        reported_user:reported_id(username, profile_picture)
      `)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting unresolved reports:', error);
    return { data: null, error };
  }
};

// Get reports submitted by a user
export const getUserReports = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user reports:', error);
    return { data: null, error };
  }
};

// Resolve a report (admin function)
export const resolveReport = async (
  reportId: string,
  adminId: string,
  resolutionNotes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
        resolution_notes: resolutionNotes,
      })
      .eq('id', reportId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error resolving report:', error);
    return { data: null, error };
  }
};

// Ban a user (admin function)
export const banUser = async (userId: string, adminId: string, reason: string) => {
  try {
    // Update user record to mark as banned
    const { data, error } = await supabase
      .from('users')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_by: adminId,
        ban_reason: reason,
      })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log the activity
    await logActivity(adminId, 'ban' as any, userId, reason);

    return { data, error: null };
  } catch (error) {
    console.error('Error banning user:', error);
    return { data: null, error };
  }
};

// Unban a user (admin function)
export const unbanUser = async (userId: string, adminId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        is_banned: false,
        unbanned_at: new Date().toISOString(),
        unbanned_by: adminId,
      })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log the activity
    await logActivity(adminId, 'unban' as any, userId);

    return { data, error: null };
  } catch (error) {
    console.error('Error unbanning user:', error);
    return { data: null, error };
  }
};

// Delete a post (admin function)
export const deletePost = async (postId: string, adminId: string, reason: string) => {
  try {
    // First get the post to know who owns it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, content')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    // Delete the post
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .select();

    if (error) throw error;

    // Log the activity
    await logActivity(
      adminId, 
      'delete_post' as any, 
      postId, 
      `Post deleted: ${post.content.substring(0, 50)}... Reason: ${reason}`,
      post.user_id
    );

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { data: null, error };
  }
};

// Mute a user (user function)
export const muteUser = async (userId: string, mutedUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('muted_users')
      .insert({
        user_id: userId,
        muted_user_id: mutedUserId,
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error muting user:', error);
    return { data: null, error };
  }
};

// Unmute a user (user function)
export const unmuteUser = async (userId: string, mutedUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('muted_users')
      .delete()
      .eq('user_id', userId)
      .eq('muted_user_id', mutedUserId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error unmuting user:', error);
    return { data: null, error };
  }
};

// Get list of muted users for a user
export const getMutedUsers = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('muted_users')
      .select(`
        muted_user_id,
        muted_users:muted_user_id(id, username, profile_picture)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting muted users:', error);
    return { data: null, error };
  }
};

// Check if a user is admin
export const isUserAdmin = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { isAdmin: data?.is_admin || false, error: null };
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return { isAdmin: false, error };
  }
};

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  activeUsers: number;
}

export const moderationService = {
  async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        { count: totalUsers },
        { count: totalPosts },
        { count: totalComments },
        { count: totalReports },
        { count: activeUsers },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase
          .from('posts')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalReports: totalReports || 0,
        activeUsers: activeUsers || 0,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  },

  async banUser(adminId: string, userId: string, reason: string) {
    try {
      const { error: banError } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId);

      if (banError) throw banError;

      await this.logActivity(adminId, 'post_like' as ActivityType, userId, reason);
    } catch (error) {
      console.error('Error banning user:', error);
      throw new Error('Failed to ban user');
    }
  },

  async unbanUser(adminId: string, userId: string) {
    try {
      const { error: unbanError } = await supabase
        .from('users')
        .update({ is_banned: false })
        .eq('id', userId);

      if (unbanError) throw unbanError;

      await this.logActivity(adminId, 'post_like' as ActivityType, userId);
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw new Error('Failed to unban user');
    }
  },

  async deletePost(adminId: string, postId: string, reason: string) {
    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      await this.logActivity(adminId, 'post_like' as ActivityType, postId, reason);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  },

  async logActivity(
    adminId: string,
    type: ActivityType,
    targetId: string,
    reason?: string
  ) {
    try {
      const { error } = await supabase.from('admin_activities').insert({
        admin_id: adminId,
        type,
        target_id: targetId,
        reason,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin activity:', error);
      throw new Error('Failed to log admin activity');
    }
  },
}; 