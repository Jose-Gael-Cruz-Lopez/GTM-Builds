DROP POLICY IF EXISTS "Anyone can submit a signup" ON public.business_signups;

CREATE POLICY "Anyone can submit a valid signup"
  ON public.business_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(business_name)) BETWEEN 2 AND 120
    AND length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(business_type) BETWEEN 1 AND 60
  );