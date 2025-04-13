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
  delete_reason TEXT
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
  -- Ensure each user can only vote once per option (for multiple choice polls)
  UNIQUE(poll_id, option_id, user_id)
);

CREATE INDEX IF NOT EXISTS polls_post_id_idx ON polls(post_id);
CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_option_id_idx ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON poll_votes(user_id);

--------------------------------
-- CHAT AND MESSAGING
--------------------------------

-- Group chats (for province/region chatrooms)
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  region_id TEXT, -- Reference to the region (province)
  region_name TEXT, -- Name of the region
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

-- Direct messages (between users)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Group messages
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS direct_messages_sender_recipient_idx ON direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_sender_idx ON direct_messages(recipient_id, sender_id);
CREATE INDEX IF NOT EXISTS direct_messages_created_at_idx ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS group_messages_group_id_idx ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS group_messages_created_at_idx ON group_messages(created_at DESC);

--------------------------------
-- MODERATION AND REPORTING
--------------------------------

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL, -- Could be a user ID, post ID, comment ID, etc.
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
  type activity_type NOT NULL,
  target_id TEXT NOT NULL, -- Could be a user ID, post ID, comment ID, etc.
  target_content TEXT,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users are viewable by everyone" 
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" 
  ON users FOR UPDATE USING (auth.uid() = id);

-- Post policies
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Comments are viewable by everyone" 
  ON comments FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" 
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
  ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- Like policies
CREATE POLICY "Likes are viewable by everyone" 
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts" 
  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for comment_likes...

-- Poll policies
CREATE POLICY "Polls are viewable by everyone" 
  ON polls FOR SELECT USING (true);

CREATE POLICY "Users can create polls" 
  ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Poll options are viewable by everyone" 
  ON poll_options FOR SELECT USING (true);

CREATE POLICY "Poll votes are viewable by everyone" 
  ON poll_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote on polls" 
  ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Users can view their own direct messages" 
  ON direct_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can send direct messages" 
  ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view group messages in their groups" 
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
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

-- Function to create activity on new post
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (actor_id, type, target_id, target_content)
  VALUES (NEW.user_id, 'new_post', NEW.id, substring(NEW.content, 1, 100));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post activity
CREATE TRIGGER after_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE PROCEDURE create_post_activity();

-- Function to create activity on new comment
CREATE OR REPLACE FUNCTION create_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  post_user_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_user_id FROM posts WHERE id = NEW.post_id;
  
  INSERT INTO activities (actor_id, type, target_id, target_content, target_user_id)
  VALUES (NEW.user_id, 'new_comment', NEW.id, substring(NEW.content, 1, 100), post_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment activity
CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE PROCEDURE create_comment_activity();

-- Function to create activity on new like
CREATE OR REPLACE FUNCTION create_like_activity()
RETURNS TRIGGER AS $$
DECLARE
  post_user_id UUID;
  post_content TEXT;
BEGIN
  -- Get the post details
  SELECT user_id, content INTO post_user_id, post_content FROM posts WHERE id = NEW.post_id;
  
  INSERT INTO activities (actor_id, type, target_id, target_content, target_user_id)
  VALUES (NEW.user_id, 'like', NEW.post_id, substring(post_content, 1, 100), post_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like activity
CREATE TRIGGER after_like_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE PROCEDURE create_like_activity();

-- Function to create activity on new poll
CREATE OR REPLACE FUNCTION create_poll_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (actor_id, type, target_id, target_content)
  VALUES (NEW.user_id, 'create_poll', NEW.id, NEW.question);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for poll activity
CREATE TRIGGER after_poll_insert
  AFTER INSERT ON polls
  FOR EACH ROW EXECUTE PROCEDURE create_poll_activity();

-- Function to create activity on poll vote
CREATE OR REPLACE FUNCTION create_poll_vote_activity()
RETURNS TRIGGER AS $$
DECLARE
  poll_data RECORD;
BEGIN
  -- Get the poll details
  SELECT p.id, p.question, p.user_id INTO poll_data 
  FROM polls p WHERE p.id = NEW.poll_id;
  
  INSERT INTO activities (actor_id, type, target_id, target_content, target_user_id)
  VALUES (NEW.user_id, 'vote_poll', NEW.poll_id, poll_data.question, poll_data.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for poll vote activity
CREATE TRIGGER after_poll_vote_insert
  AFTER INSERT ON poll_votes
  FOR EACH ROW EXECUTE PROCEDURE create_poll_vote_activity();

-- Function to update read_at when a message is marked as read
CREATE OR REPLACE FUNCTION update_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating read_at
CREATE TRIGGER update_direct_message_read_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW EXECUTE PROCEDURE update_message_read_at();

-- Create view for post counts
CREATE OR REPLACE VIEW user_post_counts AS
SELECT 
  u.id,
  u.username,
  COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.is_deleted = false
GROUP BY u.id, u.username;

-- Create view for follower counts
CREATE OR REPLACE VIEW user_follower_counts AS
SELECT 
  u.id,
  u.username,
  COUNT(f.id) AS follower_count
FROM users u
LEFT JOIN followers f ON u.id = f.following_id
GROUP BY u.id, u.username;

-- Create view for following counts
CREATE OR REPLACE VIEW user_following_counts AS
SELECT 
  u.id,
  u.username,
  COUNT(f.id) AS following_count
FROM users u
LEFT JOIN followers f ON u.id = f.follower_id
GROUP BY u.id, u.username; 