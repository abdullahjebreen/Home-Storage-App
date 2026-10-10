import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, X, Camera, Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { uploadPhoto, getPhotoUrlAsync } from '@/lib/image';
import { fetchLocations, fetchProperties, buildLocationTree } from '@/lib/locations';
import type { Location, Property, Category, HouseholdMember, ItemPhoto, ItemCondition, ItemImportance } from '@/lib/database.types';
import { getLocationName } from '@/lib/i18n';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

const CONDITIONS: ItemCondition[] = ['New', 'Excellent', 'Good', 'Worn', 'Damaged', 'Needs Repair'];
const IMPORTANCES: ItemImportance[] = ['Valuable', 'Important', 'Cheap', 'Doubtful Need', 'Garbage', 'Waiting for Disposition'];

export function ItemFormPage() {
  const { household, member } = useAuth();
  const { t, tc, tl, language } = useI18n();
  const navigate = useNavigate();
  const { itemId } = useParams();
  const isEdit = !!itemId;

  const [locations, setLocations] = useState<Location[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ItemPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedQrCode, setSavedQrCode] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [ownerMemberId, setOwnerMemberId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [tags, setTags] = useState('');
  const [condition, setCondition] = useState('');
  const [importance, setImportance] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [store, setStore] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [forgottenInterval, setForgottenInterval] = useState('12');

  useEffect(() => {
    if (!household) return;
    loadFormData();
  }, [household, itemId]);

  async function loadFormData() {
    if (!household) return;
    setLoading(true);
    try {
      const [locs, props, catsRes, membersRes] = await Promise.all([
        fetchLocations(household.id),
        fetchProperties(household.id),
        supabase.from('categories').select('*').eq('household_id', household.id).order('sort_order'),
        supabase.from('household_members').select('*').eq('household_id', household.id).order('display_name'),
      ]);
      setLocations(locs);
      setProperties(props);
      setCategories((catsRes.data || []) as Category[]);
      setMembers((membersRes.data || []) as HouseholdMember[]);

      if (isEdit && itemId) {
        const { data: item } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .maybeSingle();
        if (item) {
          setName(item.name || '');
          setNameAr(item.name_ar || '');
          setDescription(item.description || '');
          setLocationId(item.location_id);
          setCategoryId(item.category_id || '');
          setOwnerMemberId(item.owner_member_id || '');
          setQuantity(String(item.quantity));
          setUnit(item.unit);
          setTags((item.tags || []).join(', '));
          setCondition(item.condition || '');
          setImportance(item.importance || '');
          setPurchaseDate(item.purchase_date || '');
          setPurchasePrice(item.purchase_price ? String(item.purchase_price) : '');
          setStore(item.store || '');
          setExpiryDate(item.expiry_date || '');
          setLowStockThreshold(item.low_stock_threshold ? String(item.low_stock_threshold) : '');
          setForgottenInterval(String(item.forgotten_interval_months));

          const { data: photos } = await supabase
            .from('item_photos')
            .select('*')
            .eq('item_id', itemId)
            .order('sort_order');
          const photoList = (photos || []) as ItemPhoto[];
          setExistingPhotos(photoList);
          const urlEntries = await Promise.all(
            photoList.map(async (p) => [p.id, await getPhotoUrlAsync(p.storage_path)] as const)
          );
          setPhotoUrls(Object.fromEntries(urlEntries.filter(([, url]) => url !== null) as [string, string][]));

          setSavedQrCode(item.qr_code || null);
        }
      } else if (member) {
        setOwnerMemberId(member.id);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!household) return;
    if (!name.trim() && !nameAr.trim()) {
      setError(t('item.atLeastOneName'));
      return;
    }
    if (!locationId) {
      setError(t('item.location'));
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      household_id: household.id,
      location_id: locationId,
      qr_code: isEdit ? undefined : crypto.randomUUID(),
      category_id: categoryId || null,
      name: name.trim() || null,
      name_ar: nameAr.trim() || null,
      description: description.trim() || null,
      owner_member_id: ownerMemberId || null,
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'pcs',
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      condition: condition || null,
      importance: importance || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      store: store.trim() || null,
      expiry_date: expiryDate || null,
      low_stock_threshold: lowStockThreshold ? parseInt(lowStockThreshold) : null,
      forgotten_interval_months: parseInt(forgottenInterval) || 12,
      last_activity_at: new Date().toISOString(),
    };

    let savedItemId = itemId;

    if (isEdit && itemId) {
      const { error: err } = await supabase.from('items').update(payload).eq('id', itemId);
      if (err) {
        setError(t('item.saveFailed'));
        setSaving(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase.from('items').insert(payload).select().single();
      if (err || !data) {
        setError(t('item.saveFailed'));
        setSaving(false);
        return;
      }
      savedItemId = data.id;
    }

    // Upload pending photos
    for (let i = 0; i < pendingPhotos.length; i++) {
      const photoId = crypto.randomUUID();
      const { path, error: uploadErr } = await uploadPhoto(household.id, savedItemId!, photoId, pendingPhotos[i]);
      if (uploadErr || !path) continue;
      await supabase.from('item_photos').insert({
        item_id: savedItemId,
        household_id: household.id,
        storage_path: path,
        is_primary: existingPhotos.length === 0 && i === 0,
        sort_order: existingPhotos.length + i,
      });
    }

    setSaving(false);
    navigate(`/items/${savedItemId}`);
  }

  async function handleDeletePhoto(photoId: string) {
    const photo = existingPhotos.find((p) => p.id === photoId);
    if (!photo) return;
    await supabase.storage.from('item-photos').remove([photo.storage_path]);
    await supabase.from('item_photos').delete().eq('id', photoId);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleSetPrimary(photoId: string) {
    if (!itemId) return;
    await supabase.from('item_photos').update({ is_primary: false }).eq('item_id', itemId);
    await supabase.from('item_photos').update({ is_primary: true }).eq('id', photoId);
    setExistingPhotos((prev) => prev.map((p) => ({ ...p, is_primary: p.id === photoId })));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-ghost !px-2">
          <ChevronLeft size={22} className="rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEdit ? t('item.editItem') : t('item.newItem')}
        </h1>
      </div>

      <form onSubmit={handleSave} className="card p-4 sm:p-6 space-y-4">
        {/* Photos */}
        <div>
          <label className="label-text">{t('item.photos')}</label>
          <div className="flex gap-2 flex-wrap">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                {photoUrls[photo.id] && (
                  <img src={photoUrls[photo.id]} alt="" className="w-full h-full object-cover" />
                )}
                {photo.is_primary && (
                  <div className="absolute top-1 start-1 bg-primary-600 text-white rounded-full p-0.5">
                    <Star size={12} fill="white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!photo.is_primary && (
                    <button type="button" onClick={() => handleSetPrimary(photo.id)} className="text-white bg-white/20 rounded p-1">
                      <Star size={12} />
                    </button>
                  )}
                  <button type="button" onClick={() => handleDeletePhoto(photo.id)} className="text-white bg-error-500/80 rounded p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {pendingPhotos.map((file, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0 end-0 bg-error-500 text-white rounded-bl-lg p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
              <Camera size={20} className="text-slate-400" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setPendingPhotos((prev) => [...prev, ...files]);
                }}
              />
            </label>
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder={t('item.namePlaceholder')} />
          </div>
          <div>
            <label className="label-text">{t('item.nameAr')}</label>
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input-field" dir="rtl" />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label-text">{t('item.location')} *</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input-field" required>
            <option value="">—</option>
            {properties.map((prop) => (
              <optgroup key={prop.id} label={prop.name}>
                {buildLocationTree(locations, prop.id).map(({ location: loc, depth }) => (
                  <option key={loc.id} value={loc.id}>
                    {depth > 0 ? '\u200E' + '\u2003'.repeat(depth) + '└ ' : ''}{getLocationName(loc, language)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Category + Owner */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.category')}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
              <option value="">{t('common.none')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{tc(cat)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">{t('item.owner')}</label>
            <select value={ownerMemberId} onChange={(e) => setOwnerMemberId(e.target.value)} className="input-field">
              <option value="">{t('item.shared')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.quantity')}</label>
            <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('item.unit')}</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label-text">{t('item.description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} placeholder={t('item.descriptionPlaceholder')} />
        </div>

        {/* Tags */}
        <div>
          <label className="label-text">{t('item.tags')}</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="tag1, tag2, tag3" />
        </div>

        {/* Condition + Importance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.condition')}</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input-field">
              <option value="">{t('common.none')}</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{t(`condition.${c.replace(/\s+/g, '')}` as never)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">{t('item.importance')}</label>
            <select value={importance} onChange={(e) => setImportance(e.target.value)} className="input-field">
              <option value="">{t('common.none')}</option>
              {IMPORTANCES.map((i) => (
                <option key={i} value={i}>{t(`importance.${i.replace(/\s+/g, '')}` as never)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Purchase info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.purchaseDate')}</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('item.purchasePrice')}</label>
            <input type="number" min="0" step="any" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.store')}</label>
            <input value={store} onChange={(e) => setStore(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('item.expiryDate')}</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Low stock + forgotten interval */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('item.lowStockThreshold')}</label>
            <input type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">{t('item.forgottenInterval')}</label>
            <input type="number" min="1" value={forgottenInterval} onChange={(e) => setForgottenInterval(e.target.value)} className="input-field" />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">{t('item.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('common.loading') : t('item.save')}
          </button>
        </div>

        {savedQrCode && (
          <QRCodeDisplay value={savedQrCode} label={name || nameAr || undefined} />
        )}
      </form>
    </div>
  );
}
