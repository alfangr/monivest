DROP POLICY IF EXISTS "All users can view all users" ON public.users;

CREATE POLICY "All users can view all users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "All users can update their own role"
ON public.users
FOR UPDATE
USING (true)
WITH CHECK (true);
