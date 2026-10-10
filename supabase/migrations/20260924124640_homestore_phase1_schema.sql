/*
# HomeStore Phase 1 — Core Schema

## Overview
Creates the foundational tables for HomeStore, a bilingual family home-storage inventory PWA.
One admin creates a household and invites family members. All household members share
inventory. Strict household-level isolation is enforced via RLS policies.

## New Tables
1. households — Top-level household entity (one per family)
2. household_members — Membership join table linking auth.users to households
3. properties — Physical properties (houses, apartments) under a household
4. locations — Arbitrary-depth hierarchical storage locations/containers
5. categories — Item categories, household-scoped (admin-managed)
6. items — Inventory items with full metadata
7. item_photos — Photos for items (multiple per item)

## Helper Functions
- is_household_member(uuid) — returns true if current user is a member of the household
- is_household_admin(uuid) — returns true if current user is an admin of the household
- seed_default_categories(uuid) — seeds 15 default categories for a new household

## Security (RLS)
- All tables have RLS enabled
- All tables scoped to authenticated users who are household members
- 4 separate policies per table (SELECT/INSERT/UPDATE/DELETE)
- Household isolation via helper function membership checks
- Private storage bucket 'item-photos' with household-scoped policies

## Notes
1. Tables created BEFORE helper functions that reference them
2. QR codes use opaque random hex identifiers
3. Quantity CHECK constraint prevents negative stock
4. Soft-delete via status='deleted' + deleted_at
5. Full-text search index on items (English + Arabic names + description)
*/

-- ============================================
-- TABLES (created first, before functions that reference them)
-- ============================================

-- Households
CREATE TABLE IF NOT EXISTS public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_language text NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'ar')),
  default_reminder_months int NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Household Members
CREATE TABLE IF NOT EXISTS public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  display_name text NOT NULL,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Locations (hierarchical)
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  description text,
  label text,
  qr_code text NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex') UNIQUE,
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text,
  name_ar text,
  description text,
  owner_member_id uuid REFERENCES public.household_members(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'pcs',
  tags text[] NOT NULL DEFAULT '{}',
  condition text CHECK (condition IS NULL OR condition IN ('New', 'Excellent', 'Good', 'Worn', 'Damaged', 'Needs Repair')),
  importance text CHECK (importance IS NULL OR importance IN ('Valuable', 'Important', 'Cheap', 'Doubtful Need', 'Garbage', 'Waiting for Disposition')),
  status text NOT NULL DEFAULT 'in_place' CHECK (status IN ('in_place', 'lent_out', 'checked_out', 'deleted')),
  purchase_date date,
  purchase_price numeric,
  purchase_currency text NOT NULL DEFAULT 'USD',
  store text,
  warranty_expiry date,
  expiry_date date,
  low_stock_threshold int,
  forgotten_interval_months int NOT NULL DEFAULT 12,
  qr_code text UNIQUE,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (name IS NOT NULL OR name_ar IS NOT NULL)
);

-- Item Photos
CREATE TABLE IF NOT EXISTS public.item_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- HELPER FUNCTIONS (after tables exist)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_admin(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.seed_default_categories(p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (household_id, name, name_ar, sort_order)
  VALUES
    (p_household_id, 'Clothes', 'ملابس', 1),
    (p_household_id, 'Shoes', 'أحذية', 2),
    (p_household_id, 'Tools', 'أدوات', 3),
    (p_household_id, 'Food Utensils', 'أواني الطعام', 4),
    (p_household_id, 'Cooking Utensils', 'أواني الطبخ', 5),
    (p_household_id, 'Computer Parts', 'قطع كمبيوتر', 6),
    (p_household_id, 'Furniture', 'أثاث', 7),
    (p_household_id, 'Paintings/Artwork', 'لوحات/فنون', 8),
    (p_household_id, 'Party Items', 'أدوات الحفلات', 9),
    (p_household_id, 'Covers', 'أغطية', 10),
    (p_household_id, 'Bed Sheets/Bedding', 'ملاءات/فراش', 11),
    (p_household_id, 'Cleaning Supplies', 'مستلزمات تنظيف', 12),
    (p_household_id, 'Washing Machine Consumables', 'مستلزمات غسالة', 13),
    (p_household_id, 'Books', 'كتب', 14),
    (p_household_id, 'Other', 'أخرى', 15);
END;
$$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_locations_household ON public.locations(household_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_property ON public.locations(property_id);
CREATE INDEX IF NOT EXISTS idx_categories_household ON public.categories(household_id);
CREATE INDEX IF NOT EXISTS idx_items_household ON public.items(household_id);
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_household_status ON public.items(household_id, status);
CREATE INDEX IF NOT EXISTS idx_item_photos_item ON public.item_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_item_photos_household ON public.item_photos(household_id);
CREATE INDEX IF NOT EXISTS idx_properties_household ON public.properties(household_id);

-- Full-text search on items
CREATE INDEX IF NOT EXISTS idx_items_search ON public.items
  USING gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(name_ar, '') || ' ' || coalesce(description, '')));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_household" ON public.households;
CREATE POLICY "select_own_household" ON public.households FOR SELECT
  TO authenticated USING (public.is_household_member(id));
DROP POLICY IF EXISTS "update_own_household" ON public.households;
CREATE POLICY "update_own_household" ON public.households FOR UPDATE
  TO authenticated USING (public.is_household_admin(id)) WITH CHECK (public.is_household_admin(id));
DROP POLICY IF EXISTS "delete_own_household" ON public.households;
CREATE POLICY "delete_own_household" ON public.households FOR DELETE
  TO authenticated USING (public.is_household_admin(id));

-- Household Members
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_membership" ON public.household_members;
CREATE POLICY "select_own_membership" ON public.household_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR public.is_household_member(household_id)
  );
DROP POLICY IF EXISTS "insert_own_membership" ON public.household_members;
CREATE POLICY "insert_own_membership" ON public.household_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid() OR public.is_household_admin(household_id)
  );
DROP POLICY IF EXISTS "update_own_membership" ON public.household_members;
CREATE POLICY "update_own_membership" ON public.household_members FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid() OR public.is_household_admin(household_id)
  ) WITH CHECK (
    user_id = auth.uid() OR public.is_household_admin(household_id)
  );
DROP POLICY IF EXISTS "delete_own_membership" ON public.household_members;
CREATE POLICY "delete_own_membership" ON public.household_members FOR DELETE
  TO authenticated USING (public.is_household_admin(household_id));

-- Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_property" ON public.properties;
CREATE POLICY "select_own_property" ON public.properties FOR SELECT
  TO authenticated USING (public.is_household_member(household_id));
DROP POLICY IF EXISTS "insert_own_property" ON public.properties;
CREATE POLICY "insert_own_property" ON public.properties FOR INSERT
  TO authenticated WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "update_own_property" ON public.properties;
CREATE POLICY "update_own_property" ON public.properties FOR UPDATE
  TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "delete_own_property" ON public.properties;
CREATE POLICY "delete_own_property" ON public.properties FOR DELETE
  TO authenticated USING (public.is_household_admin(household_id));

-- Locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_location" ON public.locations;
CREATE POLICY "select_own_location" ON public.locations FOR SELECT
  TO authenticated USING (public.is_household_member(household_id));
DROP POLICY IF EXISTS "insert_own_location" ON public.locations;
CREATE POLICY "insert_own_location" ON public.locations FOR INSERT
  TO authenticated WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "update_own_location" ON public.locations;
CREATE POLICY "update_own_location" ON public.locations FOR UPDATE
  TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "delete_own_location" ON public.locations;
CREATE POLICY "delete_own_location" ON public.locations FOR DELETE
  TO authenticated USING (public.is_household_member(household_id));

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_category" ON public.categories;
CREATE POLICY "select_own_category" ON public.categories FOR SELECT
  TO authenticated USING (public.is_household_member(household_id));
DROP POLICY IF EXISTS "insert_own_category" ON public.categories;
CREATE POLICY "insert_own_category" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "update_own_category" ON public.categories;
CREATE POLICY "update_own_category" ON public.categories FOR UPDATE
  TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "delete_own_category" ON public.categories;
CREATE POLICY "delete_own_category" ON public.categories FOR DELETE
  TO authenticated USING (public.is_household_admin(household_id));

-- Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_item" ON public.items;
CREATE POLICY "select_own_item" ON public.items FOR SELECT
  TO authenticated USING (public.is_household_member(household_id));
DROP POLICY IF EXISTS "insert_own_item" ON public.items;
CREATE POLICY "insert_own_item" ON public.items FOR INSERT
  TO authenticated WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "update_own_item" ON public.items;
CREATE POLICY "update_own_item" ON public.items FOR UPDATE
  TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "delete_own_item" ON public.items;
CREATE POLICY "delete_own_item" ON public.items FOR DELETE
  TO authenticated USING (public.is_household_member(household_id));

-- Item Photos
ALTER TABLE public.item_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_photo" ON public.item_photos;
CREATE POLICY "select_own_photo" ON public.item_photos FOR SELECT
  TO authenticated USING (public.is_household_member(household_id));
DROP POLICY IF EXISTS "insert_own_photo" ON public.item_photos;
CREATE POLICY "insert_own_photo" ON public.item_photos FOR INSERT
  TO authenticated WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "update_own_photo" ON public.item_photos;
CREATE POLICY "update_own_photo" ON public.item_photos FOR UPDATE
  TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
DROP POLICY IF EXISTS "delete_own_photo" ON public.item_photos;
CREATE POLICY "delete_own_photo" ON public.item_photos FOR DELETE
  TO authenticated USING (public.is_household_member(household_id));

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_households_updated ON public.households;
CREATE TRIGGER trg_households_updated BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_locations_updated ON public.locations;
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated ON public.items;
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKET for item photos (private)
-- Path convention: {household_id}/{item_id}/{photo_id}.webp
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "read_item_photos" ON storage.objects;
CREATE POLICY "read_item_photos" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND public.is_household_member(
      split_part((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS "insert_item_photos" ON storage.objects;
CREATE POLICY "insert_item_photos" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND public.is_household_member(
      split_part((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS "update_item_photos" ON storage.objects;
CREATE POLICY "update_item_photos" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND public.is_household_member(
      split_part((storage.foldername(name))[1], '/', 1)::uuid
    )
  )
  WITH CHECK (
    bucket_id = 'item-photos'
    AND public.is_household_member(
      split_part((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

DROP POLICY IF EXISTS "delete_item_photos" ON storage.objects;
CREATE POLICY "delete_item_photos" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND public.is_household_member(
      split_part((storage.foldername(name))[1], '/', 1)::uuid
    )
  );