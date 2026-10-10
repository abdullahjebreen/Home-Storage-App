import { supabase } from '@/lib/supabase';
import type { Location, Property } from '@/lib/database.types';

export async function fetchLocations(householdId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('household_id', householdId)
    .order('name');
  if (error) throw error;
  return data as Location[];
}

export async function fetchProperties(householdId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('household_id', householdId)
    .order('name');
  if (error) throw error;
  return data as Property[];
}

export type LocationTreeNode = {
  location: Location;
  depth: number;
};

export function buildLocationTree(
  locations: Location[],
  propertyId: string
): LocationTreeNode[] {
  const filtered = locations.filter((l) => l.property_id === propertyId);
  const result: LocationTreeNode[] = [];

  function addChildren(parentId: string | null, depth: number) {
    const children = filtered.filter((l) => l.parent_id === parentId);
    for (const child of children) {
      result.push({ location: child, depth });
      addChildren(child.id, depth + 1);
    }
  }

  addChildren(null, 0);
  return result;
}

export type LocationBreadcrumb = { id: string; name: string; name_ar: string | null };

export async function buildBreadcrumb(
  location: Location,
  allLocations: Location[]
): Promise<LocationBreadcrumb[]> {
  const chain: LocationBreadcrumb[] = [
    { id: location.id, name: location.name, name_ar: location.name_ar },
  ];
  let current = location;
  while (current.parent_id) {
    const parent = allLocations.find((l) => l.id === current.parent_id);
    if (!parent) break;
    chain.unshift({ id: parent.id, name: parent.name, name_ar: parent.name_ar });
    current = parent;
  }
  return chain;
}
