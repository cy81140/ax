export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          likes_count: number
          comments_count: number
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          likes_count?: number
          comments_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          likes_count?: number
          comments_count?: number
        }
      }
      users: {
        Row: {
          id: string
          username: string
          email: string
          profile_picture: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          profile_picture?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          profile_picture?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          text?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: 'post_like' | 'post_comment' | 'follow' | 'comment_reply'
          created_at: string
          sender_id: string
          recipient_id: string
          post_id: string | null
          comment_id: string | null
          read: boolean
        }
        Insert: {
          id?: string
          type: 'post_like' | 'post_comment' | 'follow' | 'comment_reply'
          created_at?: string
          sender_id: string
          recipient_id: string
          post_id?: string | null
          comment_id?: string | null
          read?: boolean
        }
        Update: {
          id?: string
          type?: 'post_like' | 'post_comment' | 'follow' | 'comment_reply'
          created_at?: string
          sender_id?: string
          recipient_id?: string
          post_id?: string | null
          comment_id?: string | null
          read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 