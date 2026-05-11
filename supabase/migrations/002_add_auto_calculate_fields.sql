ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS auto_calculate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_type TEXT DEFAULT 'annual' CHECK (return_type IN ('monthly', 'annual'));
