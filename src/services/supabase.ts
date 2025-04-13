import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          profile_picture: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          profile_picture?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          profile_picture?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      polls: {
        Row: {
          id: string;
          post_id: string;
          question: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          question: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          question?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          option_text: string;
          vote_count: number;
        };
        Insert: {
          id?: string;
          poll_id: string;
          option_text: string;
          vote_count?: number;
        };
        Update: {
          id?: string;
          poll_id?: string;
          option_text?: string;
          vote_count?: number;
        };
      };
      regions: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_chats: {
        Row: {
          id: string;
          region_id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          region_id: string;
          name: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          region_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          sender_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          sender_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          sender_id?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
          last_read_message_id: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
          last_read_message_id?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_message_id?: string | null;
        };
      };
      typing_indicators: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}; 