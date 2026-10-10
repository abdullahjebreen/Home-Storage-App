-- Add missing INSERT policy on households table.
-- Without this, RLS blocks all inserts, so signup silently fails
-- after the auth account is created — the user ends up logged in
-- with no household, member, or property records.

DROP POLICY IF EXISTS "insert_own_household" ON public.households;
CREATE POLICY "insert_own_household" ON public.households FOR INSERT
  TO authenticated WITH CHECK (true);
