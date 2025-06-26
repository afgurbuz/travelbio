-- Create profiles table (no trigger for now)
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

-- Insert basic countries
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
  ('BR', 'Brazil', '🇧🇷')
ON CONFLICT (code) DO NOTHING;