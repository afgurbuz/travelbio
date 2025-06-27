-- Add rating columns to user_locations table
ALTER TABLE user_locations
ADD COLUMN transportation_rating INTEGER CHECK (transportation_rating >= 1 AND transportation_rating <= 5),
ADD COLUMN accommodation_rating INTEGER CHECK (accommodation_rating >= 1 AND accommodation_rating <= 5),
ADD COLUMN food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
ADD COLUMN safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
ADD COLUMN activities_rating INTEGER CHECK (activities_rating >= 1 AND activities_rating <= 5),
ADD COLUMN value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
ADD COLUMN overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
ADD COLUMN comment TEXT;

-- Add description column to countries table for your custom content
ALTER TABLE countries
ADD COLUMN description TEXT,
ADD COLUMN currency VARCHAR(10),
ADD COLUMN language VARCHAR(100),
ADD COLUMN best_time_to_visit VARCHAR(200);

-- Create a view for country ratings
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

-- Create a view for city ratings
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