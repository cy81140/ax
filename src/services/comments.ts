import { supabase } from './supabase';
import { AminoError, ErrorTypes } from '../utils/errors';
import { logActivity } from './activity';
import { createApiResponse } from '../utils/errors';

export const commentService = {
  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<{ error: any }> {
    try {
      // First check if user has already liked this comment
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingLike) {
        // Already liked, no need to proceed
        return { error: null };
      }

      // Check if the comment exists
      const { data: commentExists, error: commentCheckError } = await supabase
        .from('comments')
        .select('id, user_id')
        .eq('id', commentId)
        .single();
        
      if (commentCheckError) {
        return { error: { message: `Comment not found: ${commentId}` } };
      }
        
      // Now add the like
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented comment like operation');
          return { error: { message: 'You do not have permission to like this comment' } };
        }
        throw error;
      }

      // Log like activity
      try {
        // Comment owner is already in the commentExists data
        if (commentExists && commentExists.user_id !== userId) {
          await logActivity(userId, 'like', commentExists.user_id, 'user');
        }
      } catch (activityError) {
        console.error("Failed to log comment like activity:", activityError);
      }

      return { error: null };
    } catch (error) {
      console.error("Error liking comment:", error);
      return { error };
    }
  },

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<{ error: any }> {
    try {
      // First check if the comment exists
      const { error: commentCheckError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .single();
        
      if (commentCheckError) {
        return { error: { message: `Comment not found: ${commentId}` } };
      }
      
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented comment unlike operation');
          return { error: { message: 'You do not have permission to unlike this comment' } };
        }
        throw error;
      }
      
      return { error: null };
    } catch (error) {
      console.error("Error unliking comment:", error);
      return { error };
    }
  },

  /**
   * Check if user has liked a comment
   */
  async isLikedByUser(commentId: string, userId: string): Promise<{ data: boolean; error: any }> {
    try {
      // First check if the comment exists
      const { error: commentCheckError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .single();
        
      if (commentCheckError) {
        return { data: false, error: { message: `Comment not found: ${commentId}` } };
      }
    
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // PGRST116 is "Not found" which is fine, it means no like exists
        if (error.code === 'PGRST116') {
          return { data: false, error: null };
        }
        
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented checking comment like status');
          return { data: false, error: { message: 'Permission error checking like status' } };
        }
        
        throw error;
      }
      return { data: !!data, error: null };
    } catch (error) {
      console.error("Error checking comment like status:", error);
      return { data: false, error };
    }
  },
  
  /**
   * Get number of likes for a comment
   */
  async getLikeCount(commentId: string): Promise<{ data: number; error: any }> {
    try {
      // First check if the comment exists
      const { error: commentCheckError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .single();
        
      if (commentCheckError) {
        return { data: 0, error: { message: `Comment not found: ${commentId}` } };
      }
    
      const { count, error } = await supabase
        .from('comment_likes')
        .select('id', { count: 'exact' })
        .eq('comment_id', commentId);

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented getting comment like count');
          return { data: 0, error: { message: 'Permission error getting like count' } };
        }
        throw error;
      }
      return { data: count || 0, error: null };
    } catch (error) {
      console.error("Error getting comment like count:", error);
      return { data: 0, error };
    }
  },
  
  /**
   * Create a new comment
   */
  async createComment(postId: string, userId: string, content: string): Promise<{ data: any; error: any }> {
    try {
      // First check if post exists
      const { data: postExists, error: postCheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();
        
      if (postCheckError) {
        return { data: null, error: { message: `Post not found: ${postId}` } };
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: content
        })
        .select();

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented comment creation');
          return { data: null, error: { message: 'You do not have permission to comment on this post' } };
        }
        throw error;
      }
      
      // Increment comment count on the post
      try {
        await supabase.rpc('increment_comment_count', { post_id: postId });
      } catch (countError) {
        console.error("Failed to increment comment count:", countError);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("Error creating comment:", error);
      return { data: null, error };
    }
  },
  
  /**
   * Get comments for a post
   */
  async getCommentsByPostId(postId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id(username, profile_picture),
          likes_count:comment_likes(count)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to have likes_count as a number
      const formattedData = data.map(comment => ({
        ...comment,
        likes_count: comment.likes_count || 0
      }));
      
      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error fetching comments:", error);
      return { data: null, error };
    }
  }
}; 