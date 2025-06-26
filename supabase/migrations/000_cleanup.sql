-- Cleanup: Drop all existing tables and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS user_countries CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Disable RLS on auth.users if enabled
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;