ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pengguna';

UPDATE public.users SET role = 'pengguna' WHERE role IS NULL;
