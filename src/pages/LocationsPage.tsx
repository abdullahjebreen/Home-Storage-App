import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus, MapPin, Package, ChevronLeft, Trash2, Edit, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { getPhotoUrlAsync, uploadLocationPhoto } from '@/lib/image';
import { fetchLocations, fetchProperties, buildBreadcrumb, buildLocationTree, type LocationBreadcrumb } from '@/lib/locations';
import type { Location, Property, ItemWithRelations } from '@/lib/database.types';
import { getLocationName } from '@/lib/i18n';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

export function LocationsPage() {
  const { household } = useAuth();
  const { tl, t, language } = useI18n();
  const navigate = useNavigate();
  const { locationId } = useParams();

  const [locations, setLocations] = useState<Location[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [children, setChildren] = useState<Location[]>([]);
  const [items, setItems] = useState<ItemWithRelations[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<LocationBreadcrumb[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [itemPhotoUrls, setItemPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const loadData = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    try {
      const [locs, props] = await Promise.all([
        fetchLocations(household.id),
        fetchProperties(household.id),
      ]);
      setLocations(locs);
      setProperties(props);

      if (locationId) {
        const loc = locs.find((l) => l.id === locationId) || null;
        setCurrentLocation(loc);
        if (loc) {
          setChildren(locs.filter((l) => l.parent_id === loc.id));
          const bc = await buildBreadcrumb(loc, locs);
          setBreadcrumb(bc);

          if (loc.photo_path) {
            const url = await getPhotoUrlAsync(loc.photo_path);
            setPhotoUrl(url);
          } else {
            setPhotoUrl(null);
          }

          const { data: itemData } = await supabase
            .from('items')
            .select('*, location:locations(*), category:categories(*), owner:household_members(*), item_photos(*)')
            .eq('location_id', loc.id)
            .neq('status', 'deleted')
            .order('name');
          const itemResult = (itemData || []) as unknown as ItemWithRelations[];
          setItems(itemResult);

          const primaryPhotos = itemResult
            .map((item) => item.item_photos?.find((p) => p.is_primary) || item.item_photos?.[0])
            .filter((p): p is NonNullable<typeof p> => !!p);
          const urlEntries = await Promise.all(
            primaryPhotos.map(async (photo) => {
              const url = await getPhotoUrlAsync(photo.storage_path);
              return [photo.item_id, url] as const;
            })
          );
          setItemPhotoUrls(Object.fromEntries(urlEntries.filter(([, url]) => url !== null) as [string, string][]));
        }
      } else {
        setCurrentLocation(null);
        setChildren(locs.filter((l) => l.parent_id === null));
        setItems([]);
        setBreadcrumb([]);
        setPhotoUrl(null);

        const { count } = await supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', household.id)
          .neq('status', 'deleted');
        void count;
      }
    } catch {
      // error state
    } finally {
      setLoading(false);
    }
  }, [household, locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUploadPhoto(location: Location, file: File) {
    if (!household) return;
    const { path, error } = await uploadLocationPhoto(household.id, location.id, file);
    if (error || !path) return;
    await supabase.from('locations').update({ photo_path: path }).eq('id', location.id);
    loadData();
  }

  async function handleDeleteLocation(loc: Location) {
    if (children.length > 0 || items.length > 0) {
      alert(t('location.cannotDeleteNonEmpty'));
      return;
    }
    if (!confirm(t('location.delete') + '?')) return;
    if (loc.photo_path) {
      await supabase.storage.from('item-photos').remove([loc.photo_path]);
    }
    await supabase.from('locations').delete().eq('id', loc.id);
    navigate(locationId ? `/locations` : '/locations');
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap text-sm">
          <button
            onClick={() => navigate('/locations')}
            className="text-slate-500 hover:text-primary-600 font-medium"
          >
            {t('nav.locations')}
          </button>
          {breadcrumb.map((bc, i) => (
            <div key={bc.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-400 rtl:rotate-180" />
              <button
                onClick={() => i < breadcrumb.length - 1 && navigate(`/locations/${bc.id}`)}
                className={`font-medium ${i === breadcrumb.length - 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-primary-600'}`}
              >
                {language === 'ar' && bc.name_ar ? bc.name_ar : bc.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Location photo + info */}
      {currentLocation && (
        <div className="card overflow-hidden">
          {photoUrl ? (
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
              <img src={photoUrl} alt={tl(currentLocation)} className="w-full h-full object-cover" />
              <label className="absolute bottom-2 end-2 bg-black/60 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-black/80">
                <Camera size={14} />
                {t('location.contextPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPhoto(currentLocation, file);
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MapPin size={32} className="text-slate-300" />
              <label className="absolute bottom-2 end-2 bg-black/60 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-black/80">
                <Camera size={14} />
                {t('location.contextPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPhoto(currentLocation, file);
                  }}
                />
              </label>
            </div>
          )}
          <div className="p-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{tl(currentLocation)}</h2>
            {currentLocation.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentLocation.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditingLocation(currentLocation)}
                className="btn-ghost text-sm"
              >
                <Edit size={16} />
                {t('common.edit')}
              </button>
              <button
                onClick={() => handleDeleteLocation(currentLocation)}
                className="btn-ghost text-sm text-error-600"
              >
                <Trash2 size={16} />
                {t('common.delete')}
              </button>
            </div>
            {currentLocation.qr_code && (
              <div className="mt-3">
                <QRCodeDisplay value={currentLocation.qr_code} label={tl(currentLocation)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-locations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">{t('location.sublocations')}</h3>
          <button
            onClick={() => { setEditingLocation(null); setShowAddModal(true); }}
            className="btn-ghost text-sm"
          >
            <Plus size={16} />
            {t('location.addLocation')}
          </button>
        </div>
        {children.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">{t('location.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => navigate(`/locations/${child.id}`)}
                className="card p-3 flex items-center gap-3 hover:border-primary-300 transition-colors text-start"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{tl(child)}</p>
                  {child.label && <p className="text-xs text-slate-500">{child.label}</p>}
                </div>
                <ChevronRight size={18} className="text-slate-400 rtl:rotate-180 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items in this location */}
      {currentLocation && (
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{t('location.containedItems')}</h3>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">{t('location.empty')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="card overflow-hidden text-start group"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                    {itemPhotoUrls[item.id] ? (
                      <img
                        src={itemPhotoUrls[item.id]}
                        alt={item.name || item.name_ar || ''}
                        className="w-full h-full object-cover group-active:scale-95 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {item.name || item.name_ar}
                    </p>
                    <p className="text-xs text-slate-500">{item.quantity} {item.unit}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <LocationFormModal
          householdId={household!.id}
          properties={properties}
          locations={locations}
          parentLocation={currentLocation}
          editing={editingLocation}
          onClose={() => { setShowAddModal(false); setEditingLocation(null); }}
          onSaved={() => { setShowAddModal(false); setEditingLocation(null); loadData(); }}
        />
      )}
    </div>
  );
}

function LocationFormModal({
  householdId,
  properties,
  locations,
  parentLocation,
  editing,
  onClose,
  onSaved,
}: {
  householdId: string;
  properties: Property[];
  locations: Location[];
  parentLocation: Location | null;
  editing: Location | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, language } = useI18n();
  const [name, setName] = useState(editing?.name || '');
  const [nameAr, setNameAr] = useState(editing?.name_ar || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [label, setLabel] = useState(editing?.label || '');
  const [parentId, setParentId] = useState(editing?.parent_id || parentLocation?.id || '');
  const [propertyId, setPropertyId] = useState(
    editing?.property_id || properties[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const treeNodes = buildLocationTree(
    locations.filter((l) => l.id !== editing?.id),
    propertyId
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() && !nameAr.trim()) {
      setError(t('item.atLeastOneName'));
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      household_id: householdId,
      property_id: propertyId,
      parent_id: parentId || null,
      name: name.trim() || null,
      name_ar: nameAr.trim() || null,
      description: description.trim() || null,
      label: label.trim() || null,
    };

    const { error: err } = editing
      ? await supabase.from('locations').update(payload).eq('id', editing.id)
      : await supabase.from('locations').insert(payload);

    setSaving(false);
    if (err) {
      setError(t('location.saveFailed'));
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white">
            {editing ? t('location.editLocation') : t('location.addLocation')}
          </h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-1">
            <ChevronLeft size={20} className="rtl:rotate-180" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="label-text">{t('location.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('location.nameAr')} ({t('common.optional')})</label>
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input-field" dir="rtl" />
          </div>
          <div>
            <label className="label-text">{t('location.property')}</label>
            <select
              value={propertyId}
              onChange={(e) => { setPropertyId(e.target.value); setParentId(''); }}
              className="input-field"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">{t('location.parent')}</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input-field">
              <option value="">{t('location.topLevel')}</option>
              {treeNodes.map(({ location: l, depth }) => (
                <option key={l.id} value={l.id}>
                  {depth > 0 ? '\u200E' + '\u2003'.repeat(depth) + '└ ' : ''}{getLocationName(l, language)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">{t('location.label')} ({t('common.optional')})</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('location.description')} ({t('common.optional')})</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} />
          </div>

          {error && (
            <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
