import { supabase } from './supabase';
import { handleSupabaseError, ErrorResponse } from '../utils/errorHandling';
import { uploadFile, deleteFile } from './upload';
import { logActivity } from './activity';
import { Post, User } from '../types/services';

/**
 * Interface for creating post parameters
 */
export interface CreatePostParams {
  userId: string;
  content?: string;
  mediaUrls?: string[];
  mentions?: string[];
  provinces?: string[];
  pollOptions?: string[];
  pollExpiresAt?: Date | null;
}

/**
 * Interface for post filtering
 */
export interface PostFilter {
  userId?: string;
  provinceId?: string;
  includeReplies?: boolean;
  includeReposts?: boolean;
}

/**
 * Comprehensive post service for managing posts
 */
export const postService = {
  /**
   * Create a new post with all necessary data
   */
  async createPost(params: CreatePostParams): Promise<{ data: Post | null; error: any }> {
    try {
      const { userId, content, mediaUrls = [], mentions = [], provinces = [], pollOptions = [], pollExpiresAt = null } = params;
      
      if (!userId) {
        return { data: null, error: { message: 'User ID is required' } };
      }

      // Create the post record
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content || '',
          has_media: mediaUrls.length > 0,
          has_poll: pollOptions.length > 0,
          poll_expires_at: pollExpiresAt
        })
        .select()
        .single();

      if (error) throw error;
      const postId = data.id;

      // Handle media attachments
      if (mediaUrls.length > 0) {
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaUrls.map((url: string) => ({
            post_id: postId,
            media_url: url,
            media_type: url.toLowerCase().includes('.mp4') ? 'video' : 'image'
          })));

        if (mediaError) throw mediaError;
      }

      // Handle mentions
      if (mentions.length > 0) {
        const { error: mentionsError } = await supabase
          .from('post_mentions')
          .insert(mentions.map((userId: string) => ({
            post_id: postId,
            mentioned_user_id: userId
          })));

        if (mentionsError) throw mentionsError;
        
        // Notify mentioned users
        for (const mentionedUserId of mentions) {
          try {
            await logActivity(userId, 'mention', mentionedUserId, 'user');
          } catch (activityError) {
            console.error("Failed to log mention activity:", activityError);
          }
        }
      }

      // Handle provinces
      if (provinces.length > 0) {
        const { error: provincesError } = await supabase
          .from('post_provinces')
          .insert(provinces.map((provinceId: string) => ({
            post_id: postId,
            province_id: provinceId
          })));

        if (provincesError) throw provincesError;
      }

      // Handle poll options
      if (pollOptions.length > 0) {
        // Check if we need an intermediary polls record or can connect directly to post
        let pollId = postId;
        
        // First check if the poll_options table has a poll_id column (vs post_id)
        const { data: columnData, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'poll_options')
          .eq('column_name', 'poll_id');
          
        if (columnError) throw columnError;
        
        // If poll_id column exists, we need to create a poll record first
        if (columnData && columnData.length > 0) {
          // Get the polls table structure 
          const { data: pollsData, error: pollsError } = await supabase
            .from('polls')
            .insert({
              post_id: postId,
              question: 'Poll', // Default question
              is_multiple_choice: false
            })
            .select()
            .single();
            
          if (pollsError) throw pollsError;
          pollId = pollsData.id;
            
          // Insert options with poll_id
          const { error: pollError } = await supabase
            .from('poll_options')
            .insert(pollOptions.map((option: string) => ({
              poll_id: pollId,
              option_text: option
            })));
            
          if (pollError) throw pollError;
        } else {
          // Direct connection to post_id
          const { error: pollError } = await supabase
            .from('poll_options')
            .insert(pollOptions.map((option: string) => ({
              post_id: postId,
              option_text: option
            })));
            
          if (pollError) throw pollError;
        }
      }

      // Log post creation activity
      try {
        await logActivity(userId, 'post', postId, 'post');
      } catch (activityError) {
        console.error("Failed to log post creation activity:", activityError);
      }

      return { data, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'creating post');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Get a post by its ID with joined data
   */
  async getPost(postId: string): Promise<{ data: Post | null; error: any }> {
    try {
      // First, get the post without trying to join poll_options
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(*),
          media:post_media(*),
          provinces:post_provinces(province:provinces(*)),
          likes:post_likes(user_id)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error(`Error fetching post (${postId}):`, error);
        throw error;
      }

      if (!data) {
        throw new Error(`Post not found: ${postId}`);
      }

      // If the post has a poll, try to fetch poll options separately
      if (data.has_poll) {
        try {
          // First check if we have a polls table as an intermediary
          const { data: pollData, error: pollError } = await supabase
            .from('polls')
            .select('id')
            .eq('post_id', postId)
            .single();
            
          if (!pollError && pollData) {
            // We have a polls table, so fetch options via poll_id
            const { data: optionsData, error: optionsError } = await supabase
              .from('poll_options')
              .select('*')
              .eq('poll_id', pollData.id);
              
            if (!optionsError && optionsData) {
              data.poll_options = optionsData;
            }
          } else {
            // No polls table or no record found, try direct post_id relationship
            const { data: directOptionsData, error: directOptionsError } = await supabase
              .from('poll_options')
              .select('*')
              .eq('post_id', postId);
              
            if (!directOptionsError && directOptionsData) {
              data.poll_options = directOptionsData;
            }
          }
        } catch (pollFetchError) {
          console.error('Error fetching poll options:', pollFetchError);
          // Don't fail the whole request if just poll options fail
          data.poll_options = [];
        }
      } else {
        data.poll_options = [];
      }

      // Transform the data structure
      const formattedPost = {
        ...data,
        provinces: data.provinces?.map((p: any) => p.province) || [],
        media: data.media || [],
        poll_options: data.poll_options || [],
        likes_count: data.likes?.length || 0,
        liked_by_user: false // Will be populated when needed
      };

      return { data: formattedPost, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'fetching post');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Get posts with filters and pagination
   */
  async getPosts(
    filter: PostFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ data: Post[] | null; error: any }> {
    try {
      const { userId, provinceId, includeReplies = false, includeReposts = true } = filter;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(*),
          media:post_media(*),
          provinces:post_provinces(province:provinces(*)),
          poll_options(*),
          likes:post_likes(user_id),
          replies:posts!reply_to_post_id(id, count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by user if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Filter by province if provided
      if (provinceId) {
        // Use a subquery approach
        const { data: provincePostIds, error: provinceError } = await supabase
          .from('post_provinces')
          .select('post_id')
          .eq('province_id', provinceId);
        
        if (provinceError) {
          console.error('Error fetching province posts:', provinceError);
          throw provinceError;
        }
        
        if (provincePostIds && provincePostIds.length > 0) {
          const postIds = provincePostIds.map(item => item.post_id);
          query = query.in('id', postIds);
        } else {
          // No posts with this province, return empty result
          return { data: [], error: null };
        }
      }

      // Filter out replies if not requested
      if (!includeReplies) {
        query = query.is('reply_to_post_id', null);
      }

      // Filter out reposts if not requested
      if (!includeReposts) {
        query = query.is('repost_of_post_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      if (!data) {
        return { data: [], error: null };
      }

      // Transform the data structure
      const formattedPosts = data.map(post => ({
        ...post,
        provinces: post.provinces?.map((p: any) => p.province) || [],
        media: post.media || [],
        poll_options: post.poll_options || [],
        likes_count: post.likes?.length || 0,
        replies_count: post.replies?.length || 0,
        liked_by_user: false // Will be populated when needed
      }));

      return { data: formattedPosts, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'fetching posts');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Delete a post by ID
   */
  async deletePost(postId: string, userId: string): Promise<{ error: any }> {
    try {
      // First verify the user is the post owner
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      
      if (post.user_id !== userId) {
        return { error: { message: 'You can only delete your own posts' } };
      }

      // Get media to delete from storage
      const { data: media } = await supabase
        .from('post_media')
        .select('media_url')
        .eq('post_id', postId);

      // Delete the post (relies on cascade for related tables)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Clean up media files from storage
      if (media && media.length > 0) {
        for (const item of media) {
          try {
            // Extract the path from the URL
            const url = new URL(item.media_url);
            const path = url.pathname.split('/').slice(2).join('/');
            
            await deleteFile(path, 'posts');
          } catch (storageError) {
            console.error('Failed to delete media file:', storageError);
            // Continue with other deletions even if one fails
          }
        }
      }

      return { error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'deleting post');
      return { error: errorResponse.error };
    }
  },

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<{ error: any }> {
    try {
      // First check if user has already liked post to avoid duplicates
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingLike) {
        // Already liked, no need to proceed
        return { error: null };
      }

      // Check if the post exists
      const { data: postExists, error: postCheckError } = await supabase
        .from('posts')
        .select('id, user_id')
        .eq('id', postId)
        .single();
        
      if (postCheckError) {
        return { error: { message: `Post not found: ${postId}` } };
      }
        
      // Now add the like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented like operation');
          return { error: { message: 'You do not have permission to like this post' } };
        }
        throw error;
      }

      // Log like activity
      try {
        // Post owner is already in the postExists data
        if (postExists && postExists.user_id !== userId) {
          await logActivity(userId, 'like', postExists.user_id, 'user');
        }
      } catch (activityError) {
        console.error("Failed to log like activity:", activityError);
      }

      return { error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'liking post');
      return { error: errorResponse.error };
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<{ error: any }> {
    try {
      // First check if the post exists
      const { error: postCheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();
        
      if (postCheckError) {
        return { error: { message: `Post not found: ${postId}` } };
      }
      
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        // If this is a RLS error, handle it gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented unlike operation');
          return { error: { message: 'You do not have permission to unlike this post' } };
        }
        throw error;
      }
      
      return { error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'unliking post');
      return { error: errorResponse.error };
    }
  },

  /**
   * Check if user has liked a post
   */
  async isLikedByUser(postId: string, userId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return { data: !!data, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'checking post like status');
      return { data: false, error: errorResponse.error };
    }
  },

  /**
   * Get users who liked a post
   */
  async getPostLikes(postId: string): Promise<{ data: User[] | null; error: any }> {
    try {
      // First get the user_ids who liked the post
      const { data: likeData, error: likeError } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', postId);

      if (likeError) throw likeError;
      
      if (!likeData || likeData.length === 0) {
        return { data: [], error: null };
      }
      
      // Then get the user details for those IDs
      const userIds = likeData.map(like => like.user_id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
        
      if (userError) throw userError;
      
      return { data: userData, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'fetching post likes');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Create a reply to a post
   */
  async createReply(
    postId: string, 
    userId: string, 
    content: string, 
    mediaUrls: string[] = []
  ): Promise<{ data: Post | null; error: any }> {
    try {
      // Create the reply post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content || '',
          reply_to_post_id: postId,
          has_media: mediaUrls.length > 0
        })
        .select()
        .single();

      if (error) throw error;
      const replyId = data.id;

      // Handle media attachments
      if (mediaUrls.length > 0) {
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaUrls.map(url => ({
            post_id: replyId,
            media_url: url,
            media_type: url.toLowerCase().includes('.mp4') ? 'video' : 'image'
          })));

        if (mediaError) throw mediaError;
      }

      // Get the original post's author for notification
      const { data: originalPost } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      // Log reply activity for notification
      try {
        if (originalPost && originalPost.user_id !== userId) {
          await logActivity(userId, 'reply', originalPost.user_id, 'user');
        }
      } catch (activityError) {
        console.error("Failed to log reply activity:", activityError);
      }

      return { data, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'creating reply');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Get replies to a post
   */
  async getReplies(
    postId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: Post[] | null; error: any }> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(*),
          media:post_media(*),
          likes:post_likes(user_id)
        `)
        .eq('reply_to_post_id', postId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform the data structure
      const formattedReplies = data.map(reply => ({
        ...reply,
        media: reply.media || [],
        likes_count: reply.likes?.length || 0,
        liked_by_user: false // Will be populated when needed
      }));

      return { data: formattedReplies, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'fetching replies');
      return { data: null, error: errorResponse.error };
    }
  },

  /**
   * Repost a post
   */
  async repostPost(postId: string, userId: string, content?: string): Promise<{ data: Post | null; error: any }> {
    try {
      // Create the repost
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content || '',
          repost_of_post_id: postId
        })
        .select()
        .single();

      if (error) throw error;
      
      // Get original post's author for notification
      const { data: originalPost } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      // Log repost activity for notification
      try {
        if (originalPost && originalPost.user_id !== userId) {
          await logActivity(userId, 'repost', originalPost.user_id, 'user');
        }
      } catch (activityError) {
        console.error("Failed to log repost activity:", activityError);
      }

      return { data, error: null };
    } catch (error) {
      const errorResponse = await handleSupabaseError(error, 'reposting post');
      return { data: null, error: errorResponse.error };
    }
  }
}; 