-- Seed data for Amino App

-- First, create some test users
INSERT INTO auth.users (id, email, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'user1@example.com', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'user2@example.com', 'authenticated');

-- Insert user profiles
INSERT INTO users (id, username, email, profile_picture, bio, is_admin) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@example.com', 'https://example.com/admin.jpg', 'System Administrator', true),
  ('22222222-2222-2222-2222-222222222222', 'user1', 'user1@example.com', 'https://example.com/user1.jpg', 'Active community member', false),
  ('33333333-3333-3333-3333-333333333333', 'user2', 'user2@example.com', 'https://example.com/user2.jpg', 'New to the community', false);

-- Create some regions (Philippines)
INSERT INTO regions (id, name, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'National Capital Region', 'Metro Manila and surrounding areas'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Central Luzon', 'Region III'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CALABARZON', 'Region IV-A');

-- Create group chats for each region
INSERT INTO group_chats (id, name, description, region_id, created_by) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Manila Chat', 'Chat for Manila residents', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Quezon City Chat', 'Chat for QC residents', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Bulacan Chat', 'Chat for Bulacan residents', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111');

-- Add users to group chats
INSERT INTO group_chat_members (id, group_id, user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333');

-- Create some sample posts
INSERT INTO posts (id, user_id, content, image_url) VALUES
  ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Welcome to our community!', 'https://example.com/welcome.jpg'),
  ('22222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Check out this amazing view!', 'https://example.com/view.jpg'),
  ('33333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'Hello everyone!', null);

-- Add some comments
INSERT INTO comments (id, post_id, user_id, content) VALUES
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Thanks for the welcome!'),
  ('22222222-2222-2222-2222-222222222224', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', 'Beautiful view!');

-- Add some post likes
INSERT INTO post_likes (id, post_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222225', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333');

-- Add some comment likes
INSERT INTO comment_likes (id, comment_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111113', '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222226', '22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111');

-- Create a sample poll
INSERT INTO polls (id, post_id, user_id, question, is_multiple_choice) VALUES
  ('11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'What is your favorite feature?', false);

-- Add poll options
INSERT INTO poll_options (id, poll_id, option_text) VALUES
  ('11111111-1111-1111-1111-111111111117', '11111111-1111-1111-1111-111111111116', 'Chat Rooms'),
  ('22222222-2222-2222-2222-222222222227', '11111111-1111-1111-1111-111111111116', 'Posts'),
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111116', 'Polls');

-- Add some poll votes
INSERT INTO poll_votes (id, poll_id, option_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111118', '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111117', '22222222-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222228', '11111111-1111-1111-1111-111111111116', '22222222-2222-2222-2222-222222222227', '33333333-3333-3333-3333-333333333333');

-- Add some sample messages
INSERT INTO group_messages (id, group_id, user_id, content) VALUES
  ('11111111-1111-1111-1111-111111111119', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Welcome to Manila Chat!'),
  ('22222222-2222-2222-2222-222222222229', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Thanks! Happy to be here!');

-- Add some followers
INSERT INTO followers (id, follower_id, following_id) VALUES
  ('11111111-1111-1111-1111-111111111120', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222230', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

-- Add some muted users
INSERT INTO muted_users (id, user_id, muted_user_id) VALUES
  ('11111111-1111-1111-1111-111111111121', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');

-- Add some sample reports
INSERT INTO reports (id, reporter_id, reported_id, report_type, reason) VALUES
  ('11111111-1111-1111-1111-111111111122', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'user', 'Inappropriate behavior'),
  ('22222222-2222-2222-2222-222222222231', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'post', 'Spam content');

-- Add some activities
INSERT INTO activities (id, actor_id, action_type, target_id, target_type) VALUES
  ('11111111-1111-1111-1111-111111111123', '11111111-1111-1111-1111-111111111111', 'new_post', '11111111-1111-1111-1111-111111111112', 'post'),
  ('22222222-2222-2222-2222-222222222232', '22222222-2222-2222-2222-222222222222', 'new_comment', '11111111-1111-1111-1111-111111111113', 'comment'),
  ('33333333-3333-3333-3333-333333333336', '22222222-2222-2222-2222-222222222222', 'like', '11111111-1111-1111-1111-111111111112', 'post'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'follow', '11111111-1111-1111-1111-111111111111', 'user'); 