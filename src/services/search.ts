import { supabase } from './supabase';

// Define types for search results
export interface UserSearchResult {
  id: string;
  type: 'user';
  username: string;
  profile_picture: string | null;
  bio: string | null;
}

export interface PostSearchResult {
  id: string;
  type: 'post';
  content: string;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  user: {
    username: string;
    profile_picture: string | null;
  };
}

export type SearchResult = UserSearchResult | PostSearchResult;

// Search for users
export const searchUsers = async (query: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile_picture, bio')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) throw error;

    // Transform data to match the expected format
    const results: UserSearchResult[] = data.map((user: any) => ({
      id: user.id,
      type: 'user' as const,
      username: user.username,
      profile_picture: user.profile_picture,
      bio: user.bio,
    }));

    return { data: results, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Search for posts
export const searchPosts = async (query: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, 
        content, 
        created_at,
        image_url,
        video_url,
        user_id,
        users:user_id (username, profile_picture)
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data to match the expected format
    const results: PostSearchResult[] = [];
    
    for (const post of data) {
      // Extract user data with proper typing
      let username = 'Unknown user';
      let profilePicture: string | null = null;
      
      // Handle the users field which might be an array or an object
      if (post.users) {
        if (Array.isArray(post.users) && post.users.length > 0) {
          username = post.users[0].username || 'Unknown user';
          profilePicture = post.users[0].profile_picture || null;
        } else if (typeof post.users === 'object') {
          // Type assertion with proper checks
          const userObj = post.users as Record<string, any>;
          username = typeof userObj.username === 'string' ? userObj.username : 'Unknown user';
          profilePicture = typeof userObj.profile_picture === 'string' ? userObj.profile_picture : null;
        }
      }
      
      results.push({
        id: post.id,
        type: 'post' as const,
        content: post.content,
        created_at: post.created_at,
        image_url: post.image_url,
        video_url: post.video_url,
        user_id: post.user_id,
        user: {
          username,
          profile_picture: profilePicture
        }
      });
    }

    return { data: results, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Combined search function that searches for both users and posts
export const search = async (query: string, limit = 10) => {
  try {
    // Perform both searches in parallel
    const [usersResult, postsResult] = await Promise.all([
      searchUsers(query, limit),
      searchPosts(query, limit),
    ]);

    // Handle errors
    if (usersResult.error) throw usersResult.error;
    if (postsResult.error) throw postsResult.error;

    // Combine and sort results (users first, then posts)
    const combinedResults: SearchResult[] = [
      ...(usersResult.data || []),
      ...(postsResult.data || []),
    ];

    return { data: combinedResults, error: null };
  } catch (error) {
    return { data: null, error };
  }
}; 