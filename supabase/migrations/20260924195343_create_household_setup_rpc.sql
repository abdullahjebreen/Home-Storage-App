/*
# Create household setup RPC

## Overview
Creates a SECURITY DEFINER function that atomically provisions a new household
with its first admin member, a default property, and seed categories.

This solves the RLS chicken-and-egg problem: INSERT on `households` succeeds but
the follow-up `.select()` fails because the SELECT policy requires membership
that doesn't exist until the `household_members` row is created.

## New Functions
- `create_household_with_member(text, text, text, text)` — Creates household,
  admin member, default property, and seeds categories in one atomic call.
  Returns the new household's UUID.

## Security
- SECURITY DEFINER with fixed search_path so it can INSERT across tables
  regardless of RLS. Callable only by authenticated users.
*/

CREATE OR REPLACE FUNCTION public.create_household_with_member(
  p_household_name text,
  p_language text,
  p_display_name text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
BEGIN
  -- Create the household
  INSERT INTO public.households (name, default_language)
  VALUES (p_household_name, p_language)
  RETURNING id INTO v_household_id;

  -- Add the caller as admin
  INSERT INTO public.household_members (household_id, user_id, role, display_name, language)
  VALUES (v_household_id, p_user_id, 'admin', p_display_name, p_language);

  -- Create a default property
  INSERT INTO public.properties (household_id, name)
  VALUES (v_household_id, CASE WHEN p_language = 'ar' THEN 'منزل' ELSE 'Home' END);

  -- Seed default categories
  PERFORM public.seed_default_categories(v_household_id);

  RETURN v_household_id;
END;
$$;

-- Restrict to authenticated only
REVOKE ALL ON FUNCTION public.create_household_with_member(text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household_with_member(text, text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household_with_member(text, text, text, uuid) TO authenticated;
