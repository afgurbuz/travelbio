-- TravelBio - Fresh Database Setup
-- Run this in Supabase SQL Editor after creating a new project

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create countries table
CREATE TABLE public.countries (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag TEXT NOT NULL
);

-- Create cities table
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_id INTEGER REFERENCES public.countries(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, country_id)
);

-- Create user_locations table
CREATE TABLE public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  country_id INTEGER REFERENCES public.countries(id) ON DELETE CASCADE,
  city_id INTEGER REFERENCES public.cities(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('lived', 'visited')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_id, city_id, type)
);

-- Insert countries data
INSERT INTO public.countries (code, name, flag) VALUES
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
  ('EG', 'Egypt', '🇪🇬'),
  ('BE', 'Belgium', '🇧🇪'),
  ('AT', 'Austria', '🇦🇹'),
  ('PL', 'Poland', '🇵🇱'),
  ('ID', 'Indonesia', '🇮🇩'),
  ('MY', 'Malaysia', '🇲🇾'),
  ('VN', 'Vietnam', '🇻🇳'),
  ('PH', 'Philippines', '🇵🇭'),
  ('NZ', 'New Zealand', '🇳🇿'),
  ('IE', 'Ireland', '🇮🇪'),
  ('CZ', 'Czech Republic', '🇨🇿'),
  ('HU', 'Hungary', '🇭🇺'),
  ('RO', 'Romania', '🇷🇴'),
  ('HR', 'Croatia', '🇭🇷'),
  ('BG', 'Bulgaria', '🇧🇬'),
  ('SK', 'Slovakia', '🇸🇰'),
  ('SI', 'Slovenia', '🇸🇮'),
  ('LT', 'Lithuania', '🇱🇹'),
  ('LV', 'Latvia', '🇱🇻'),
  ('EE', 'Estonia', '🇪🇪'),
  ('IS', 'Iceland', '🇮🇸');

-- Insert major cities
INSERT INTO public.cities (name, country_id) VALUES
  -- Turkey
  ('Istanbul', (SELECT id FROM public.countries WHERE code = 'TR')),
  ('Ankara', (SELECT id FROM public.countries WHERE code = 'TR')),
  ('Izmir', (SELECT id FROM public.countries WHERE code = 'TR')),
  ('Antalya', (SELECT id FROM public.countries WHERE code = 'TR')),
  ('Bursa', (SELECT id FROM public.countries WHERE code = 'TR')),
  
  -- United States
  ('New York', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Los Angeles', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Chicago', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Houston', (SELECT id FROM public.countries WHERE code = 'US')),
  ('San Francisco', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Miami', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Boston', (SELECT id FROM public.countries WHERE code = 'US')),
  ('Seattle', (SELECT id FROM public.countries WHERE code = 'US')),
  
  -- United Kingdom
  ('London', (SELECT id FROM public.countries WHERE code = 'GB')),
  ('Manchester', (SELECT id FROM public.countries WHERE code = 'GB')),
  ('Birmingham', (SELECT id FROM public.countries WHERE code = 'GB')),
  ('Edinburgh', (SELECT id FROM public.countries WHERE code = 'GB')),
  ('Glasgow', (SELECT id FROM public.countries WHERE code = 'GB')),
  
  -- Germany
  ('Berlin', (SELECT id FROM public.countries WHERE code = 'DE')),
  ('Munich', (SELECT id FROM public.countries WHERE code = 'DE')),
  ('Hamburg', (SELECT id FROM public.countries WHERE code = 'DE')),
  ('Frankfurt', (SELECT id FROM public.countries WHERE code = 'DE')),
  ('Cologne', (SELECT id FROM public.countries WHERE code = 'DE')),
  
  -- France
  ('Paris', (SELECT id FROM public.countries WHERE code = 'FR')),
  ('Marseille', (SELECT id FROM public.countries WHERE code = 'FR')),
  ('Lyon', (SELECT id FROM public.countries WHERE code = 'FR')),
  ('Nice', (SELECT id FROM public.countries WHERE code = 'FR')),
  ('Bordeaux', (SELECT id FROM public.countries WHERE code = 'FR')),
  
  -- Italy
  ('Rome', (SELECT id FROM public.countries WHERE code = 'IT')),
  ('Milan', (SELECT id FROM public.countries WHERE code = 'IT')),
  ('Naples', (SELECT id FROM public.countries WHERE code = 'IT')),
  ('Florence', (SELECT id FROM public.countries WHERE code = 'IT')),
  ('Venice', (SELECT id FROM public.countries WHERE code = 'IT')),
  
  -- Spain
  ('Madrid', (SELECT id FROM public.countries WHERE code = 'ES')),
  ('Barcelona', (SELECT id FROM public.countries WHERE code = 'ES')),
  ('Valencia', (SELECT id FROM public.countries WHERE code = 'ES')),
  ('Seville', (SELECT id FROM public.countries WHERE code = 'ES')),
  ('Bilbao', (SELECT id FROM public.countries WHERE code = 'ES')),
  
  -- Japan
  ('Tokyo', (SELECT id FROM public.countries WHERE code = 'JP')),
  ('Osaka', (SELECT id FROM public.countries WHERE code = 'JP')),
  ('Kyoto', (SELECT id FROM public.countries WHERE code = 'JP')),
  ('Yokohama', (SELECT id FROM public.countries WHERE code = 'JP')),
  ('Nagoya', (SELECT id FROM public.countries WHERE code = 'JP'));

-- Enable public access (no RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX idx_user_locations_country ON public.user_locations(country_id);
CREATE INDEX idx_user_locations_city ON public.user_locations(city_id);
CREATE INDEX idx_cities_country ON public.cities(country_id);

-- Success message
SELECT 'TravelBio database created successfully! 🚀' as message;