import { supabase } from './supabase';
import { createPoll as createPollService } from './polls';
import { AminoError, ErrorTypes } from '../utils/errors';
import { Post, Comment, User, Poll, PollOption, PollVote } from '../types/services';

// Posts
export const createPost = async (post: Omit<Post, 'id' | 'created_at'>): Promise<Post> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        likes_count: 0,
        comments_count: 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
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

export const getPost = async (postId: string): Promise<Post> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, user:users(*)')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    throw error;
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
export const createPoll = async (postId: string, pollData: {
  question: string;
  options: string[];
}) => {
  try {
    const { question, options } = pollData;

    // First create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        post_id: postId,
        question,
        is_multiple_choice: false, // default to single choice
        ends_at: null // no end date by default
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // Then create the options
    const pollOptionsToInsert = options.map(optionText => ({
      poll_id: poll.id,
      text: optionText,
    }));

    const { data: pollOptions, error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptionsToInsert)
      .select();

    if (optionsError) throw optionsError;

    return { ...poll, options: pollOptions };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

// Storage functions for image and video uploads
export const uploadImage = async (filePath: string, file: Blob) => {
  if (!filePath || !file) {
    throw new AminoError('File path and file are required', ErrorTypes.VALIDATION_ERROR, 400);
  }

  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { ...data, publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadVideo = async (filePath: string, file: Blob) => {
  if (!filePath || !file) {
    throw new AminoError('File path and file are required', ErrorTypes.VALIDATION_ERROR, 400);
  }

  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { ...data, publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
  if (!postId || !userId) {
    throw new AminoError('Post ID and User ID are required', ErrorTypes.VALIDATION_ERROR, 400);
  }

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
  if (!postId || !userId) {
    throw new AminoError('Post ID and User ID are required', ErrorTypes.VALIDATION_ERROR, 400);
  }

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const isLiked = async (postId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
};

export const databaseService = {
  async createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPost(postId: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  },

  async getPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createPoll(poll: Omit<Poll, 'id' | 'created_at'>): Promise<Poll> {
    const { data, error } = await supabase
      .from('polls')
      .insert([poll])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPollOption(option: Omit<PollOption, 'id'>): Promise<PollOption> {
    const { data, error } = await supabase
      .from('poll_options')
      .insert([option])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPollVote(vote: Omit<PollVote, 'id' | 'created_at'>): Promise<PollVote> {
    const { data, error } = await supabase
      .from('poll_votes')
      .insert([vote])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId);

    if (error) throw error;
    return data || [];
  }
}; 