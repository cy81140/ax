export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user?: User;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  user?: User;
  post?: Post;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at?: string;
  bio?: string;
  profile_picture?: string;
  is_admin?: boolean;
  is_banned?: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  users?: User;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  last_message?: ChatMessage;
}

export interface Notification {
  id: string;
  type: ActivityType;
  recipient_id: string;
  sender_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
  read: boolean;
  sender?: User;
  post?: Post;
  comment?: Comment;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export type ActivityType = 
  | 'new_post'
  | 'new_comment'
  | 'like'
  | 'follow'
  | 'ban'
  | 'unban'
  | 'delete_post'
  | 'report'
  | 'create_poll'
  | 'vote_poll'
  | 'mention'
  | 'reply'
  | 'repost';

export interface Activity {
  id: string;
  action_type: ActivityType;
  actor_id: string;
  target_id: string;
  target_type?: string;
  created_at: string;
  post?: Post;
  comment?: Comment;
  user?: User;
}

export interface Poll {
  id: string;
  user_id: string;
  question: string;
  created_at: string;
  ends_at: string;
  user?: User;
  options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text?: string;
  option_text?: string;
  votes_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
  user?: User;
  option?: PollOption;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'comment';
  username?: string;
  content?: string;
  text?: string;
  created_at: string;
  users?: User;
  posts?: Post;
  comments?: Comment;
} 