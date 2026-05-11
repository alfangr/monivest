DROP POLICY IF EXISTS "All users can view all users" ON public.users;

CREATE POLICY "All users can view all users"
ON public.users
FOR SELECT
USING (true);
