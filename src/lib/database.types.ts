export type Household = {
  id: string;
  name: string;
  default_language: 'en' | 'ar';
  default_reminder_months: number;
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  display_name: string;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  created_at: string;
};

export type Property = {
  id: string;
  household_id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type Location = {
  id: string;
  household_id: string;
  property_id: string;
  parent_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  label: string | null;
  qr_code: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  household_id: string;
  name: string;
  name_ar: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
};

export type ItemStatus = 'in_place' | 'lent_out' | 'checked_out' | 'deleted';
export type ItemCondition = 'New' | 'Excellent' | 'Good' | 'Worn' | 'Damaged' | 'Needs Repair';
export type ItemImportance =
  | 'Valuable'
  | 'Important'
  | 'Cheap'
  | 'Doubtful Need'
  | 'Garbage'
  | 'Waiting for Disposition';

export type Item = {
  id: string;
  household_id: string;
  location_id: string;
  category_id: string | null;
  name: string | null;
  name_ar: string | null;
  description: string | null;
  owner_member_id: string | null;
  quantity: number;
  unit: string;
  tags: string[];
  condition: ItemCondition | null;
  importance: ItemImportance | null;
  status: ItemStatus;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_currency: string;
  store: string | null;
  warranty_expiry: string | null;
  expiry_date: string | null;
  low_stock_threshold: number | null;
  forgotten_interval_months: number;
  qr_code: string | null;
  last_activity_at: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemPhoto = {
  id: string;
  item_id: string;
  household_id: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
};

export type ItemWithRelations = Item & {
  location?: Location;
  category?: Category | null;
  owner?: HouseholdMember | null;
  item_photos?: ItemPhoto[];
};

export type LocationWithChildren = Location & {
  child_locations?: Location[];
  items?: ItemWithRelations[];
  property?: Property;
};
