-- Drop all existing database objects
-- This script should be run before creating the new schema

-- Drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS group_chat_members CASCADE;
DROP TABLE IF EXISTS group_chats CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS muted_users CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS activity_type CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Note: We don't drop auth.users as it's managed by Supabase Auth 