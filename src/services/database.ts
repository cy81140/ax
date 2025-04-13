import { supabase } from './supabase';
import { createPoll as createPollService } from './polls';

// Posts
export const createPost = async (userId: string, content: string, imageUrl?: string, videoUrl?: string) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: userId,
          content,
          image_url: imageUrl,
          video_url: videoUrl,
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getPosts = async (limit = 10, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, profile_picture),
        comments:comments (count),
        polls:polls (*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getPostById = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, profile_picture),
        comments:comments (*),
        polls:polls (*)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Comments
export const createComment = async (postId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: userId,
          content,
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getCommentsByPostId = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (username, profile_picture)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Polls - using the more comprehensive implementation from polls.ts
export const createPoll = async (postId: string, question: string, options: string[]) => {
  if (!postId || !question || !options || options.length < 2) {
    return { data: null, error: new Error('Invalid poll data') };
  }
  
  // We need the user ID for the comprehensive poll service
  try {
    // First fetch the post to get the user ID
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    if (!post) {
      return { data: null, error: new Error('Post not found') };
    }
    
    // Call the comprehensive poll service with all required params
    return createPollService(
      post.user_id,
      postId,
      question,
      options,
      false, // default to single choice
      null // no end date by default
    );
  } catch (error) {
    console.error('Error in createPoll:', error);
    return { data: null, error };
  }
};

// Storage functions for image and video uploads
export const uploadImage = async (filePath: string, file: Blob) => {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { data: { ...data, publicUrl: publicUrlData.publicUrl }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const uploadVideo = async (filePath: string, file: Blob) => {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { data: { ...data, publicUrl: publicUrlData.publicUrl }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error liking post:', error);
    return { data: null, error };
  }
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { data: null, error };
  }
}; 