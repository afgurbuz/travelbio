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