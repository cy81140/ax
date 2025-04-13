import { supabase, createSupabaseResponse } from './supabase';
import { createPoll as createPollService } from './polls';
import { AminoError, ErrorTypes } from '../utils/errors';

// Posts
export const createPost = async (userId: string, content: string, imageUrl?: string, videoUrl?: string) => {
  if (!userId) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('User ID is required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  if (!content && !imageUrl && !videoUrl) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('Post must have content, image, or video', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  return createSupabaseResponse(
    supabase
      .from('posts')
      .insert([
        {
          user_id: userId,
          content,
          image_url: imageUrl,
          video_url: videoUrl,
        },
      ])
      .select()
  );
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
  if (!postId) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('Post ID is required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  return createSupabaseResponse(
    supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username, profile_picture),
        comments:comments (*),
        polls:polls (*)
      `)
      .eq('id', postId)
      .single()
  );
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
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('Invalid poll data', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }
  
  try {
    // First fetch the post to get the user ID
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
      
    if (postError) {
      return createSupabaseResponse(Promise.resolve({
        data: null,
        error: postError
      }));
    }
    
    if (!post) {
      return createSupabaseResponse(Promise.resolve({
        data: null,
        error: new AminoError('Post not found', ErrorTypes.NOT_FOUND, 404)
      }));
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
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error
    }));
  }
};

// Storage functions for image and video uploads
export const uploadImage = async (filePath: string, file: Blob) => {
  if (!filePath || !file) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('File path and file are required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      return createSupabaseResponse(Promise.resolve({
        data: null,
        error
      }));
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return createSupabaseResponse(Promise.resolve({
      data: { ...data, publicUrl: publicUrlData.publicUrl },
      error: null
    }));
  } catch (error) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error
    }));
  }
};

export const uploadVideo = async (filePath: string, file: Blob) => {
  if (!filePath || !file) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('File path and file are required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (error) {
      return createSupabaseResponse(Promise.resolve({
        data: null,
        error
      }));
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return createSupabaseResponse(Promise.resolve({
      data: { ...data, publicUrl: publicUrlData.publicUrl },
      error: null
    }));
  } catch (error) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error
    }));
  }
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
  if (!postId || !userId) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('Post ID and User ID are required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  return createSupabaseResponse(
    supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select()
  );
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
  if (!postId || !userId) {
    return createSupabaseResponse(Promise.resolve({
      data: null,
      error: new AminoError('Post ID and User ID are required', ErrorTypes.VALIDATION_ERROR, 400)
    }));
  }

  return createSupabaseResponse(
    supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select()
  );
}; 