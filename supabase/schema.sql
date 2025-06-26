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
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag TEXT NOT NULL
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  UNIQUE(name, country_id)
);

-- Create user_locations table (replacing user_countries)
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE NOT NULL,
  city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('lived', 'visited')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_id, city_id, type)
);

-- Row Level Security Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Users can view all cities" ON cities FOR SELECT USING (true);

CREATE POLICY "Users can view all user_locations" ON user_locations FOR SELECT USING (true);
CREATE POLICY "Users can insert own user_locations" ON user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_locations" ON user_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_locations" ON user_locations FOR DELETE USING (auth.uid() = user_id);

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

-- Insert countries data
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
  ('RS', 'Serbia', '🇷🇸'),
  ('BG', 'Bulgaria', '🇧🇬'),
  ('SK', 'Slovakia', '🇸🇰'),
  ('SI', 'Slovenia', '🇸🇮'),
  ('LT', 'Lithuania', '🇱🇹'),
  ('LV', 'Latvia', '🇱🇻'),
  ('EE', 'Estonia', '🇪🇪'),
  ('IS', 'Iceland', '🇮🇸'),
  ('MT', 'Malta', '🇲🇹'),
  ('CY', 'Cyprus', '🇨🇾'),
  ('LU', 'Luxembourg', '🇱🇺'),
  ('MC', 'Monaco', '🇲🇨'),
  ('AD', 'Andorra', '🇦🇩'),
  ('SM', 'San Marino', '🇸🇲'),
  ('VA', 'Vatican City', '🇻🇦'),
  ('LI', 'Liechtenstein', '🇱🇮'),
  ('UA', 'Ukraine', '🇺🇦'),
  ('BY', 'Belarus', '🇧🇾'),
  ('MD', 'Moldova', '🇲🇩'),
  ('AL', 'Albania', '🇦🇱'),
  ('MK', 'North Macedonia', '🇲🇰'),
  ('BA', 'Bosnia and Herzegovina', '🇧🇦'),
  ('ME', 'Montenegro', '🇲🇪'),
  ('XK', 'Kosovo', '🇽🇰'),
  ('GE', 'Georgia', '🇬🇪'),
  ('AM', 'Armenia', '🇦🇲'),
  ('AZ', 'Azerbaijan', '🇦🇿'),
  ('IL', 'Israel', '🇮🇱'),
  ('PS', 'Palestine', '🇵🇸'),
  ('JO', 'Jordan', '🇯🇴'),
  ('LB', 'Lebanon', '🇱🇧'),
  ('SY', 'Syria', '🇸🇾'),
  ('IQ', 'Iraq', '🇮🇶'),
  ('KW', 'Kuwait', '🇰🇼'),
  ('SA', 'Saudi Arabia', '🇸🇦'),
  ('YE', 'Yemen', '🇾🇪'),
  ('OM', 'Oman', '🇴🇲'),
  ('QA', 'Qatar', '🇶🇦'),
  ('BH', 'Bahrain', '🇧🇭'),
  ('IR', 'Iran', '🇮🇷'),
  ('AF', 'Afghanistan', '🇦🇫'),
  ('PK', 'Pakistan', '🇵🇰'),
  ('BD', 'Bangladesh', '🇧🇩'),
  ('LK', 'Sri Lanka', '🇱🇰'),
  ('NP', 'Nepal', '🇳🇵'),
  ('BT', 'Bhutan', '🇧🇹'),
  ('MV', 'Maldives', '🇲🇻'),
  ('MM', 'Myanmar', '🇲🇲'),
  ('LA', 'Laos', '🇱🇦'),
  ('KH', 'Cambodia', '🇰🇭'),
  ('TW', 'Taiwan', '🇹🇼'),
  ('MN', 'Mongolia', '🇲🇳'),
  ('KP', 'North Korea', '🇰🇵'),
  ('HK', 'Hong Kong', '🇭🇰'),
  ('MO', 'Macau', '🇲🇴'),
  ('TL', 'Timor-Leste', '🇹🇱'),
  ('BN', 'Brunei', '🇧🇳'),
  ('FJ', 'Fiji', '🇫🇯'),
  ('PG', 'Papua New Guinea', '🇵🇬'),
  ('SB', 'Solomon Islands', '🇸🇧'),
  ('VU', 'Vanuatu', '🇻🇺'),
  ('NC', 'New Caledonia', '🇳🇨'),
  ('PF', 'French Polynesia', '🇵🇫'),
  ('WS', 'Samoa', '🇼🇸'),
  ('TO', 'Tonga', '🇹🇴'),
  ('KI', 'Kiribati', '🇰🇮'),
  ('PW', 'Palau', '🇵🇼'),
  ('MH', 'Marshall Islands', '🇲🇭'),
  ('FM', 'Micronesia', '🇫🇲'),
  ('NR', 'Nauru', '🇳🇷'),
  ('TV', 'Tuvalu', '🇹🇻'),
  ('CK', 'Cook Islands', '🇨🇰'),
  ('NU', 'Niue', '🇳🇺'),
  ('MA', 'Morocco', '🇲🇦'),
  ('DZ', 'Algeria', '🇩🇿'),
  ('TN', 'Tunisia', '🇹🇳'),
  ('LY', 'Libya', '🇱🇾'),
  ('SD', 'Sudan', '🇸🇩'),
  ('SS', 'South Sudan', '🇸🇸'),
  ('ET', 'Ethiopia', '🇪🇹'),
  ('ER', 'Eritrea', '🇪🇷'),
  ('DJ', 'Djibouti', '🇩🇯'),
  ('SO', 'Somalia', '🇸🇴'),
  ('KE', 'Kenya', '🇰🇪'),
  ('UG', 'Uganda', '🇺🇬'),
  ('RW', 'Rwanda', '🇷🇼'),
  ('BI', 'Burundi', '🇧🇮'),
  ('TZ', 'Tanzania', '🇹🇿'),
  ('MW', 'Malawi', '🇲🇼'),
  ('ZM', 'Zambia', '🇿🇲'),
  ('ZW', 'Zimbabwe', '🇿🇼'),
  ('MZ', 'Mozambique', '🇲🇿'),
  ('MG', 'Madagascar', '🇲🇬'),
  ('KM', 'Comoros', '🇰🇲'),
  ('MU', 'Mauritius', '🇲🇺'),
  ('SC', 'Seychelles', '🇸🇨'),
  ('RE', 'Réunion', '🇷🇪'),
  ('YT', 'Mayotte', '🇾🇹'),
  ('AO', 'Angola', '🇦🇴'),
  ('NA', 'Namibia', '🇳🇦'),
  ('BW', 'Botswana', '🇧🇼'),
  ('LS', 'Lesotho', '🇱🇸'),
  ('SZ', 'Eswatini', '🇸🇿'),
  ('CD', 'Congo (DRC)', '🇨🇩'),
  ('CG', 'Congo', '🇨🇬'),
  ('CF', 'Central African Republic', '🇨🇫'),
  ('CM', 'Cameroon', '🇨🇲'),
  ('TD', 'Chad', '🇹🇩'),
  ('GQ', 'Equatorial Guinea', '🇬🇶'),
  ('GA', 'Gabon', '🇬🇦'),
  ('ST', 'São Tomé and Príncipe', '🇸🇹'),
  ('NG', 'Nigeria', '🇳🇬'),
  ('BJ', 'Benin', '🇧🇯'),
  ('TG', 'Togo', '🇹🇬'),
  ('GH', 'Ghana', '🇬🇭'),
  ('BF', 'Burkina Faso', '🇧🇫'),
  ('CI', 'Côte d''Ivoire', '🇨🇮'),
  ('LR', 'Liberia', '🇱🇷'),
  ('SL', 'Sierra Leone', '🇸🇱'),
  ('GN', 'Guinea', '🇬🇳'),
  ('GW', 'Guinea-Bissau', '🇬🇼'),
  ('SN', 'Senegal', '🇸🇳'),
  ('GM', 'Gambia', '🇬🇲'),
  ('MR', 'Mauritania', '🇲🇷'),
  ('ML', 'Mali', '🇲🇱'),
  ('NE', 'Niger', '🇳🇪'),
  ('CV', 'Cape Verde', '🇨🇻'),
  ('CL', 'Chile', '🇨🇱'),
  ('CO', 'Colombia', '🇨🇴'),
  ('EC', 'Ecuador', '🇪🇨'),
  ('PE', 'Peru', '🇵🇪'),
  ('BO', 'Bolivia', '🇧🇴'),
  ('PY', 'Paraguay', '🇵🇾'),
  ('UY', 'Uruguay', '🇺🇾'),
  ('VE', 'Venezuela', '🇻🇪'),
  ('GY', 'Guyana', '🇬🇾'),
  ('SR', 'Suriname', '🇸🇷'),
  ('GF', 'French Guiana', '🇬🇫'),
  ('CR', 'Costa Rica', '🇨🇷'),
  ('PA', 'Panama', '🇵🇦'),
  ('NI', 'Nicaragua', '🇳🇮'),
  ('HN', 'Honduras', '🇭🇳'),
  ('SV', 'El Salvador', '🇸🇻'),
  ('GT', 'Guatemala', '🇬🇹'),
  ('BZ', 'Belize', '🇧🇿'),
  ('CU', 'Cuba', '🇨🇺'),
  ('JM', 'Jamaica', '🇯🇲'),
  ('HT', 'Haiti', '🇭🇹'),
  ('DO', 'Dominican Republic', '🇩🇴'),
  ('PR', 'Puerto Rico', '🇵🇷'),
  ('BS', 'Bahamas', '🇧🇸'),
  ('BB', 'Barbados', '🇧🇧'),
  ('TT', 'Trinidad and Tobago', '🇹🇹'),
  ('GD', 'Grenada', '🇬🇩'),
  ('VC', 'Saint Vincent and the Grenadines', '🇻🇨'),
  ('LC', 'Saint Lucia', '🇱🇨'),
  ('DM', 'Dominica', '🇩🇲'),
  ('AG', 'Antigua and Barbuda', '🇦🇬'),
  ('KN', 'Saint Kitts and Nevis', '🇰🇳')
ON CONFLICT (code) DO NOTHING;

-- Insert major cities for popular countries
INSERT INTO cities (name, country_id) VALUES
  -- Turkey
  ('Istanbul', (SELECT id FROM countries WHERE code = 'TR')),
  ('Ankara', (SELECT id FROM countries WHERE code = 'TR')),
  ('Izmir', (SELECT id FROM countries WHERE code = 'TR')),
  ('Antalya', (SELECT id FROM countries WHERE code = 'TR')),
  ('Bursa', (SELECT id FROM countries WHERE code = 'TR')),
  
  -- United States
  ('New York', (SELECT id FROM countries WHERE code = 'US')),
  ('Los Angeles', (SELECT id FROM countries WHERE code = 'US')),
  ('Chicago', (SELECT id FROM countries WHERE code = 'US')),
  ('Houston', (SELECT id FROM countries WHERE code = 'US')),
  ('San Francisco', (SELECT id FROM countries WHERE code = 'US')),
  ('Miami', (SELECT id FROM countries WHERE code = 'US')),
  ('Boston', (SELECT id FROM countries WHERE code = 'US')),
  ('Seattle', (SELECT id FROM countries WHERE code = 'US')),
  
  -- United Kingdom
  ('London', (SELECT id FROM countries WHERE code = 'GB')),
  ('Manchester', (SELECT id FROM countries WHERE code = 'GB')),
  ('Birmingham', (SELECT id FROM countries WHERE code = 'GB')),
  ('Edinburgh', (SELECT id FROM countries WHERE code = 'GB')),
  ('Glasgow', (SELECT id FROM countries WHERE code = 'GB')),
  
  -- Germany
  ('Berlin', (SELECT id FROM countries WHERE code = 'DE')),
  ('Munich', (SELECT id FROM countries WHERE code = 'DE')),
  ('Hamburg', (SELECT id FROM countries WHERE code = 'DE')),
  ('Frankfurt', (SELECT id FROM countries WHERE code = 'DE')),
  ('Cologne', (SELECT id FROM countries WHERE code = 'DE')),
  
  -- France
  ('Paris', (SELECT id FROM countries WHERE code = 'FR')),
  ('Marseille', (SELECT id FROM countries WHERE code = 'FR')),
  ('Lyon', (SELECT id FROM countries WHERE code = 'FR')),
  ('Nice', (SELECT id FROM countries WHERE code = 'FR')),
  ('Bordeaux', (SELECT id FROM countries WHERE code = 'FR')),
  
  -- Italy
  ('Rome', (SELECT id FROM countries WHERE code = 'IT')),
  ('Milan', (SELECT id FROM countries WHERE code = 'IT')),
  ('Naples', (SELECT id FROM countries WHERE code = 'IT')),
  ('Florence', (SELECT id FROM countries WHERE code = 'IT')),
  ('Venice', (SELECT id FROM countries WHERE code = 'IT')),
  
  -- Spain
  ('Madrid', (SELECT id FROM countries WHERE code = 'ES')),
  ('Barcelona', (SELECT id FROM countries WHERE code = 'ES')),
  ('Valencia', (SELECT id FROM countries WHERE code = 'ES')),
  ('Seville', (SELECT id FROM countries WHERE code = 'ES')),
  ('Bilbao', (SELECT id FROM countries WHERE code = 'ES')),
  
  -- Japan
  ('Tokyo', (SELECT id FROM countries WHERE code = 'JP')),
  ('Osaka', (SELECT id FROM countries WHERE code = 'JP')),
  ('Kyoto', (SELECT id FROM countries WHERE code = 'JP')),
  ('Yokohama', (SELECT id FROM countries WHERE code = 'JP')),
  ('Nagoya', (SELECT id FROM countries WHERE code = 'JP')),
  
  -- China
  ('Beijing', (SELECT id FROM countries WHERE code = 'CN')),
  ('Shanghai', (SELECT id FROM countries WHERE code = 'CN')),
  ('Guangzhou', (SELECT id FROM countries WHERE code = 'CN')),
  ('Shenzhen', (SELECT id FROM countries WHERE code = 'CN')),
  ('Hong Kong', (SELECT id FROM countries WHERE code = 'CN')),
  
  -- Brazil
  ('São Paulo', (SELECT id FROM countries WHERE code = 'BR')),
  ('Rio de Janeiro', (SELECT id FROM countries WHERE code = 'BR')),
  ('Brasília', (SELECT id FROM countries WHERE code = 'BR')),
  ('Salvador', (SELECT id FROM countries WHERE code = 'BR')),
  ('Fortaleza', (SELECT id FROM countries WHERE code = 'BR')),
  
  -- Australia
  ('Sydney', (SELECT id FROM countries WHERE code = 'AU')),
  ('Melbourne', (SELECT id FROM countries WHERE code = 'AU')),
  ('Brisbane', (SELECT id FROM countries WHERE code = 'AU')),
  ('Perth', (SELECT id FROM countries WHERE code = 'AU')),
  ('Adelaide', (SELECT id FROM countries WHERE code = 'AU')),
  
  -- Canada
  ('Toronto', (SELECT id FROM countries WHERE code = 'CA')),
  ('Montreal', (SELECT id FROM countries WHERE code = 'CA')),
  ('Vancouver', (SELECT id FROM countries WHERE code = 'CA')),
  ('Calgary', (SELECT id FROM countries WHERE code = 'CA')),
  ('Ottawa', (SELECT id FROM countries WHERE code = 'CA')),
  
  -- Netherlands
  ('Amsterdam', (SELECT id FROM countries WHERE code = 'NL')),
  ('Rotterdam', (SELECT id FROM countries WHERE code = 'NL')),
  ('The Hague', (SELECT id FROM countries WHERE code = 'NL')),
  ('Utrecht', (SELECT id FROM countries WHERE code = 'NL')),
  
  -- India
  ('Mumbai', (SELECT id FROM countries WHERE code = 'IN')),
  ('Delhi', (SELECT id FROM countries WHERE code = 'IN')),
  ('Bangalore', (SELECT id FROM countries WHERE code = 'IN')),
  ('Hyderabad', (SELECT id FROM countries WHERE code = 'IN')),
  ('Chennai', (SELECT id FROM countries WHERE code = 'IN'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Load additional cities from separate file
-- Run cities-data.sql after this file