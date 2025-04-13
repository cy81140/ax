import { supabase } from './supabase';
import { Post, User, Comment } from '../types/services';

export type SearchResult = User | Post | Comment;

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
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
      .ilike('text', `%${query}%`);

    if (usersError || postsError || commentsError) {
      throw new Error('Error searching');
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
  }
}; 