-- Final migration - No triggers, just tables
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS user_countries CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create countries table
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag TEXT NOT NULL
);

-- Insert countries
INSERT INTO countries (code, name, flag) VALUES
  ('TR', 'Turkey', '🇹🇷'),
  ('US', 'United States', '🇺🇸'),
  ('GB', 'United Kingdom', '🇬🇧'),
  ('DE', 'Germany', '🇩🇪'),
  ('FR', 'France', '🇫🇷'),
  ('IT', 'Italy', '🇮🇹'),
  ('ES', 'Spain', '🇪🇸'),
  ('JP', 'Japan', '🇯🇵'),
  ('CN', 'China', '🇨🇳'),
  ('BR', 'Brazil', '🇧🇷'),
  ('AU', 'Australia', '🇦🇺'),
  ('CA', 'Canada', '🇨🇦'),
  ('NL', 'Netherlands', '🇳🇱'),
  ('CH', 'Switzerland', '🇨🇭'),
  ('SE', 'Sweden', '🇸🇪'),
  ('NO', 'Norway', '🇳🇴'),
  ('DK', 'Denmark', '🇩🇰'),
  ('FI', 'Finland', '🇫🇮'),
  ('RU', 'Russia', '🇷🇺'),
  ('IN', 'India', '🇮🇳')
ON CONFLICT (code) DO NOTHING;