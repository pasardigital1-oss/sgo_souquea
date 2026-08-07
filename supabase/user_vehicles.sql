CREATE TABLE IF NOT EXISTS user_vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  make_id INTEGER REFERENCES vehicle_makes(id),
  model_id INTEGER REFERENCES vehicle_models(id),
  year INTEGER,
  trim TEXT,
  plate_number TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON user_vehicles TO authenticated;

ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_vehicles_own" ON user_vehicles
  FOR ALL USING (user_id = auth.uid());
