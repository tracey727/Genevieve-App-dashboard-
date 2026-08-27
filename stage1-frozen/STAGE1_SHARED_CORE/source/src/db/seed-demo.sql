-- Fictional/de-identified development tenant records only.
INSERT INTO agencies(code,name) VALUES
('DEMO-A','GENEVIEVE Demo Agency A'),
('DEMO-B','GENEVIEVE Demo Agency B')
ON CONFLICT(code) DO NOTHING;
