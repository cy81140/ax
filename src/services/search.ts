import { supabase } from './supabase';
import { Post, User, Comment } from '../types/services';

export type SearchResult = User | Post | Comment;

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`);
  
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .ilike('content', `%${query}%`);
  
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .ilike('content', `%${query}%`);
  
      if (usersError) {
        console.error('Error searching users:', usersError);
        throw new Error('Error searching users');
      }
      
      if (postsError) {
        console.error('Error searching posts:', postsError);
        throw new Error('Error searching posts');
      }
      
      if (commentsError) {
        console.error('Error searching comments:', commentsError);
        throw new Error('Error searching comments');
      }
  
      const combinedResults: SearchResult[] = [
        ...(users || []),
        ...(posts || []),
        ...(comments || []),
      ];
  
      return combinedResults.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
}; 