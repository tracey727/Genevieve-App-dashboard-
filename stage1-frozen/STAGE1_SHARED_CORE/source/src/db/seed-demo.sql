INSERT INTO agencies(code,name) VALUES
('DEMO-AMB','Demo Ambulance Service'),
('DEMO-FIRE','Demo Fire & Rescue')
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name;

-- Create users with scripts/create-user.mjs.
