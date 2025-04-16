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
      regions: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      provinces: {
        Row: {
          id: string
          name: string
          description: string | null
          region_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          region_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          region_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      province_chats: {
        Row: {
          id: string
          region_id: string | null
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
          last_message_at: string | null
          created_by: string | null
          province_id: string | null
          message_count: number | null
          is_active: boolean | null
          chat_type: string | null
        }
        Insert: {
          id?: string
          region_id?: string | null
          name: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_message_at?: string | null
          created_by?: string | null
          province_id?: string | null
          message_count?: number | null
          is_active?: boolean | null
          chat_type?: string | null
        }
        Update: {
          id?: string
          region_id?: string | null
          name?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_message_at?: string | null
          created_by?: string | null
          province_id?: string | null
          message_count?: number | null
          is_active?: boolean | null
          chat_type?: string | null
        }
      }
      province_chat_members: {
        Row: {
          province_chat_id: string
          user_id: string
          joined_at: string | null
          last_read_message_id: string | null
        }
        Insert: {
          province_chat_id: string
          user_id: string
          joined_at?: string | null
          last_read_message_id?: string | null
        }
        Update: {
          province_chat_id?: string
          user_id?: string
          joined_at?: string | null
          last_read_message_id?: string | null
        }
      }
      province_messages: {
        Row: {
          id: string
          province_chat_id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          province_chat_id: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          province_chat_id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string | null
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