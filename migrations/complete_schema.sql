-- Complete Amino App Database Schema for Supabase
-- This file contains the full database schema including tables, relationships,
-- indexes, and row level security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Define custom types
CREATE TYPE activity_type AS ENUM (
  'new_post',
  'new_comment',
  'like',
  'follow',
  'ban',
  'unban',
  'delete_post',
  'report',
  'create_poll',
  'vote_poll'
);

--------------------------------
-- USERS AND AUTHENTICATION
--------------------------------

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES users(id),
  ban_reason TEXT,
  unbanned_at TIMESTAMPTZ,
  unbanned_by UUID REFERENCES users(id),
  push_token TEXT
);

-- Create index on username for faster searches
CREATE INDEX IF NOT EXISTS users_username_idx ON users USING gin (username gin_trgm_ops);

-- Followers relationship
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Muted users relationship
CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id)
);

--------------------------------
-- REGIONS AND CHATROOMS
--------------------------------

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provinces table
CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  region_id UUID REFERENCES regions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group chats (for province/region chatrooms)
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Group chat members
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Typing indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

--------------------------------
-- CONTENT
--------------------------------

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  delete_reason TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0
);

-- Create index on post content for faster full-text search
CREATE INDEX IF NOT EXISTS posts_content_idx ON posts USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

--------------------------------
-- POLLS
--------------------------------

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT false,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

CREATE INDEX IF NOT EXISTS polls_post_id_idx ON polls(post_id);
CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_option_id_idx ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON poll_votes(user_id);

--------------------------------
-- MESSAGING
--------------------------------

-- Group messages
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_system_message BOOLEAN DEFAULT false
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS group_messages_group_id_idx ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS group_messages_created_at_idx ON group_messages(created_at DESC);

--------------------------------
-- MODERATION AND REPORTING
--------------------------------

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('user', 'post', 'comment', 'message')),
  reason TEXT NOT NULL,
  additional_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_id_idx ON reports(reported_id);
CREATE INDEX IF NOT EXISTS reports_report_type_idx ON reports(report_type);
CREATE INDEX IF NOT EXISTS reports_resolved_idx ON reports(resolved);

--------------------------------
-- ACTIVITY FEED
--------------------------------

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type activity_type NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_actor_id_idx ON activities(actor_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at DESC);

--------------------------------
-- ROW LEVEL SECURITY POLICIES
--------------------------------

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view other users' profiles" 
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE USING (auth.uid() = id);

-- Post policies
CREATE POLICY "Users can view all posts" 
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create posts" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Users can view all comments" 
  ON comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments" 
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
  ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- Like policies
CREATE POLICY "Users can view all likes" 
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Users can create likes" 
  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Poll policies
CREATE POLICY "Users can view all polls" 
  ON polls FOR SELECT USING (true);

CREATE POLICY "Users can create polls" 
  ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE USING (auth.uid() = user_id);

-- Group chat policies
CREATE POLICY "Users can view all group chats" 
  ON group_chats FOR SELECT USING (true);

CREATE POLICY "Users can create group chats" 
  ON group_chats FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can join group chats" 
  ON group_chat_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their groups" 
  ON group_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_chat_members.user_id = auth.uid()
      AND group_chat_members.group_id = group_messages.group_id
    )
  );

CREATE POLICY "Users can send messages to their groups" 
  ON group_messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_chat_members.user_id = auth.uid()
      AND group_chat_members.group_id = group_messages.group_id
    ) AND auth.uid() = user_id
  );

-- Typing indicator policies
CREATE POLICY "Users can set typing indicators in their groups"
  ON typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing indicators in their groups"
  ON typing_indicators FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_chat_members.user_id = auth.uid()
      AND group_chat_members.group_id = typing_indicators.group_id
    )
  );

CREATE POLICY "Users can delete their typing indicators"
  ON typing_indicators FOR DELETE USING (auth.uid() = user_id);

-- Province policies
CREATE POLICY "Users can view all provinces"
  ON provinces FOR SELECT USING (true);

-- Report policies
CREATE POLICY "Users can view their own reports" 
  ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
  ON reports FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can create reports" 
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin can resolve reports" 
  ON reports FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Activity feed policies
CREATE POLICY "Activities are viewable by everyone" 
  ON activities FOR SELECT USING (true);

CREATE POLICY "System can create activities" 
  ON activities FOR INSERT WITH CHECK (true);

--------------------------------
-- HELPER FUNCTIONS AND TRIGGERS
--------------------------------

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_group_chats_updated_at
  BEFORE UPDATE ON group_chats
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_provinces_updated_at
  BEFORE UPDATE ON provinces
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Create a trigger to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user(); 