-- Add date field to user_locations table
ALTER TABLE user_locations 
ADD COLUMN visit_date DATE;

-- Update existing records with creation date as visit date
UPDATE user_locations 
SET visit_date = created_at::date 
WHERE visit_date IS NULL;