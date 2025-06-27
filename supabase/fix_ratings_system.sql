-- Fix the ratings system by adding missing columns and creating views

-- First, add rating columns to user_locations table
ALTER TABLE user_locations
ADD COLUMN IF NOT EXISTS transportation_rating INTEGER CHECK (transportation_rating >= 1 AND transportation_rating <= 5),
ADD COLUMN IF NOT EXISTS accommodation_rating INTEGER CHECK (accommodation_rating >= 1 AND accommodation_rating <= 5),
ADD COLUMN IF NOT EXISTS food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
ADD COLUMN IF NOT EXISTS safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
ADD COLUMN IF NOT EXISTS activities_rating INTEGER CHECK (activities_rating >= 1 AND activities_rating <= 5),
ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
ADD COLUMN IF NOT EXISTS overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS visit_date DATE;

-- Add additional columns to countries table for better functionality
ALTER TABLE countries
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS language VARCHAR(100),
ADD COLUMN IF NOT EXISTS best_time_to_visit VARCHAR(200);

-- Create or replace the country_ratings view
CREATE OR REPLACE VIEW country_ratings AS
SELECT 
  c.id,
  c.code,
  c.name,
  c.flag,
  c.description,
  c.currency,
  c.language,
  c.best_time_to_visit,
  COUNT(DISTINCT ul.user_id) as visitor_count,
  ROUND(AVG(ul.transportation_rating)::numeric, 1) as avg_transportation,
  ROUND(AVG(ul.accommodation_rating)::numeric, 1) as avg_accommodation,
  ROUND(AVG(ul.food_rating)::numeric, 1) as avg_food,
  ROUND(AVG(ul.safety_rating)::numeric, 1) as avg_safety,
  ROUND(AVG(ul.activities_rating)::numeric, 1) as avg_activities,
  ROUND(AVG(ul.value_rating)::numeric, 1) as avg_value,
  ROUND(AVG(ul.overall_rating)::numeric, 1) as avg_overall
FROM countries c
LEFT JOIN user_locations ul ON c.id = ul.country_id
GROUP BY c.id, c.code, c.name, c.flag, c.description, c.currency, c.language, c.best_time_to_visit;

-- Create or replace the city_ratings view
CREATE OR REPLACE VIEW city_ratings AS
SELECT 
  ci.id,
  ci.name,
  ci.country_id,
  c.name as country_name,
  c.flag as country_flag,
  COUNT(DISTINCT ul.user_id) as visitor_count,
  ROUND(AVG(ul.transportation_rating)::numeric, 1) as avg_transportation,
  ROUND(AVG(ul.accommodation_rating)::numeric, 1) as avg_accommodation,
  ROUND(AVG(ul.food_rating)::numeric, 1) as avg_food,
  ROUND(AVG(ul.safety_rating)::numeric, 1) as avg_safety,
  ROUND(AVG(ul.activities_rating)::numeric, 1) as avg_activities,
  ROUND(AVG(ul.value_rating)::numeric, 1) as avg_value,
  ROUND(AVG(ul.overall_rating)::numeric, 1) as avg_overall
FROM cities ci
JOIN countries c ON ci.country_id = c.id
LEFT JOIN user_locations ul ON ci.id = ul.city_id
GROUP BY ci.id, ci.name, ci.country_id, c.name, c.flag;

-- Add some sample rating data for testing (you can remove this section after real users add ratings)
-- First, let's create some sample countries if they don't exist
INSERT INTO countries (code, name, flag, description, currency, language, best_time_to_visit) VALUES
('US', 'United States', '🇺🇸', 'Land of the free, home of the brave. Diverse landscapes from coast to coast.', 'USD', 'English', 'Year-round (varies by region)'),
('GB', 'United Kingdom', '🇬🇧', 'Rich history, stunning countryside, and vibrant cities.', 'GBP', 'English', 'May to September'),
('FR', 'France', '🇫🇷', 'Culture, cuisine, and châteaux in the heart of Europe.', 'EUR', 'French', 'April to October'),
('JP', 'Japan', '🇯🇵', 'Where ancient traditions meet cutting-edge technology.', 'JPY', 'Japanese', 'March to May, September to November'),
('AU', 'Australia', '🇦🇺', 'Vast wilderness, unique wildlife, and laid-back culture.', 'AUD', 'English', 'September to November, March to May'),
('IT', 'Italy', '🇮🇹', 'Art, history, and incredible cuisine in every corner.', 'EUR', 'Italian', 'April to June, September to October'),
('DE', 'Germany', '🇩🇪', 'Efficiency meets tradition in the heart of Europe.', 'EUR', 'German', 'May to September'),
('ES', 'Spain', '🇪🇸', 'Passionate culture, beautiful beaches, and historic cities.', 'EUR', 'Spanish', 'March to May, September to November'),
('CA', 'Canada', '🇨🇦', 'Vast wilderness, friendly people, and stunning natural beauty.', 'CAD', 'English/French', 'June to August'),
('TR', 'Turkey', '🇹🇷', 'Where Europe meets Asia, rich in history and culture.', 'TRY', 'Turkish', 'April to May, September to November')
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  currency = EXCLUDED.currency,
  language = EXCLUDED.language,
  best_time_to_visit = EXCLUDED.best_time_to_visit;

-- Create some sample cities
INSERT INTO cities (name, country_id) VALUES
('New York', (SELECT id FROM countries WHERE code = 'US')),
('Los Angeles', (SELECT id FROM countries WHERE code = 'US')),
('London', (SELECT id FROM countries WHERE code = 'GB')),
('Paris', (SELECT id FROM countries WHERE code = 'FR')),
('Tokyo', (SELECT id FROM countries WHERE code = 'JP')),
('Sydney', (SELECT id FROM countries WHERE code = 'AU')),
('Rome', (SELECT id FROM countries WHERE code = 'IT')),
('Berlin', (SELECT id FROM countries WHERE code = 'DE')),
('Barcelona', (SELECT id FROM countries WHERE code = 'ES')),
('Toronto', (SELECT id FROM countries WHERE code = 'CA')),
('Istanbul', (SELECT id FROM countries WHERE code = 'TR'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Note: To add sample ratings, you would need actual user IDs from the auth.users table
-- This can be done manually through the Supabase dashboard or when real users start using the app

-- Verify the setup
SELECT 'Countries with extended info:' as info;
SELECT id, code, name, description, currency FROM countries LIMIT 5;

SELECT 'Country ratings view sample:' as info;
SELECT * FROM country_ratings LIMIT 5;