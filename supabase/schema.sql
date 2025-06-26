-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT NOT NULL
);

-- Create user_countries table
CREATE TABLE IF NOT EXISTS user_countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT REFERENCES countries(code) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('lived', 'visited')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code, type)
);

-- Row Level Security Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all countries" ON countries FOR SELECT USING (true);

CREATE POLICY "Users can view all user_countries" ON user_countries FOR SELECT USING (true);
CREATE POLICY "Users can insert own user_countries" ON user_countries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_countries" ON user_countries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_countries" ON user_countries FOR DELETE USING (auth.uid() = user_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert initial countries data
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
  ('IN', 'India', '🇮🇳'),
  ('KR', 'South Korea', '🇰🇷'),
  ('TH', 'Thailand', '🇹🇭'),
  ('SG', 'Singapore', '🇸🇬'),
  ('AE', 'UAE', '🇦🇪'),
  ('GR', 'Greece', '🇬🇷'),
  ('PT', 'Portugal', '🇵🇹'),
  ('MX', 'Mexico', '🇲🇽'),
  ('AR', 'Argentina', '🇦🇷'),
  ('ZA', 'South Africa', '🇿🇦'),
  ('EG', 'Egypt', '🇪🇬')
ON CONFLICT (code) DO NOTHING;