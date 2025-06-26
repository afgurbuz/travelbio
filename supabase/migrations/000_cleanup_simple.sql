-- Simple cleanup (skip auth.users operations)
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS user_countries CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;