import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Edit, Trash2, Package, MapPin, User, Tag, Calendar, DollarSign,
  AlertTriangle, Clock, Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { getPhotoUrlAsync } from '@/lib/image';
import { fetchLocations, buildBreadcrumb } from '@/lib/locations';
import type { ItemWithRelations, Location, HouseholdMember, Category } from '@/lib/database.types';
import { getLocationName, getDisplayName } from '@/lib/i18n';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

export function ItemDetailPage() {
  const { household } = useAuth();
  const { t, tn, tl, tc, language } = useI18n();
  const navigate = useNavigate();
  const { itemId } = useParams();

  const [item, setItem] = useState<ItemWithRelations | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [locationPhotoUrl, setLocationPhotoUrl] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ name: string; name_ar: string | null; id: string }[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household || !itemId) return;
    loadData();
  }, [household, itemId]);

  async function loadData() {
    if (!household || !itemId) return;
    setLoading(true);
    try {
      const [locs, membersRes, catsRes] = await Promise.all([
        fetchLocations(household.id),
        supabase.from('household_members').select('*').eq('household_id', household.id).order('display_name'),
        supabase.from('categories').select('*').eq('household_id', household.id).order('sort_order'),
      ]);
      setLocations(locs);
      setMembers((membersRes.data || []) as HouseholdMember[]);
      setCategories((catsRes.data || []) as Category[]);

      const { data } = await supabase
        .from('items')
        .select('*, location:locations(*), category:categories(*), owner:household_members(*), item_photos(*)')
        .eq('id', itemId)
        .maybeSingle();
      const itemData = data as unknown as ItemWithRelations;
      setItem(itemData);

      if (itemData) {
        const photos = itemData.item_photos || [];
        const sorted = [...photos].sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return a.sort_order - b.sort_order;
        });
        const urls = await Promise.all(sorted.map((p) => getPhotoUrlAsync(p.storage_path)));
        setPhotoUrls(urls.filter((u): u is string => u !== null));

        const itemLocation = locs.find((l) => l.id === itemData.location_id);
        if (itemLocation) {
          const bc = await buildBreadcrumb(itemLocation, locs);
          setBreadcrumb(bc);
          if (itemLocation.photo_path) {
            const locUrl = await getPhotoUrlAsync(itemLocation.photo_path);
            setLocationPhotoUrl(locUrl);
          }
        }
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item || !itemId) return;
    const isValuable = item.importance === 'Valuable';
    const msg = isValuable ? t('item.confirmDeleteValuable') : t('item.confirmDelete');
    if (!confirm(msg)) return;

    const { error } = await supabase
      .from('items')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', itemId);
    if (error) {
      alert(t('item.deleteFailed'));
      return;
    }
    navigate('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <Package size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-slate-500">{t('common.error')}</p>
      </div>
    );
  }

  const owner = members.find((m) => m.id === item.owner_member_id);
  const category = categories.find((c) => c.id === item.category_id) || item.category;

  const detailRows: { icon: typeof MapPin; label: string; value: string }[] = [
    { icon: MapPin, label: t('item.location'), value: breadcrumb.map((b) => getLocationName(b, language)).join(' > ') },
    { icon: User, label: t('item.owner'), value: owner ? owner.display_name : t('item.shared') },
    { icon: Layers, label: t('item.category'), value: category ? tc(category) : t('common.none') },
    { icon: Package, label: t('item.quantity'), value: `${item.quantity} ${item.unit}` },
    { icon: Tag, label: t('item.condition'), value: item.condition ? t(`condition.${item.condition.replace(/\s+/g, '')}` as never) : t('common.none') },
    { icon: AlertTriangle, label: t('item.importance'), value: item.importance ? t(`importance.${item.importance.replace(/\s+/g, '')}` as never) : t('common.none') },
  ];

  if (item.purchase_date) detailRows.push({ icon: Calendar, label: t('item.purchaseDate'), value: new Date(item.purchase_date).toLocaleDateString() });
  if (item.purchase_price) detailRows.push({ icon: DollarSign, label: t('item.purchasePrice'), value: `${item.purchase_price} ${item.purchase_currency}` });
  if (item.store) detailRows.push({ icon: Tag, label: t('item.store'), value: item.store });
  if (item.expiry_date) detailRows.push({ icon: Calendar, label: t('item.expiryDate'), value: new Date(item.expiry_date).toLocaleDateString() });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost !px-2">
          <ChevronLeft size={22} className="rtl:rotate-180" />
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/items/${itemId}/edit`)} className="btn-ghost text-sm">
            <Edit size={18} />
            {t('item.edit')}
          </button>
          <button onClick={handleDelete} className="btn-ghost text-sm text-error-600">
            <Trash2 size={18} />
            {t('item.delete')}
          </button>
        </div>
      </div>

      {/* Photo gallery */}
      {photoUrls.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="aspect-square bg-slate-100 dark:bg-slate-800">
            <img src={photoUrls[activePhoto]} alt={tn(item.name, item.name_ar)} className="w-full h-full object-cover" />
          </div>
          {photoUrls.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto">
              {photoUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === activePhoto ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 flex items-center justify-center">
          <Package size={48} className="text-slate-300" />
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tn(item.name, item.name_ar)}</h1>
        {item.description && (
          <p className="text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3">
            <row.icon size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 w-28 shrink-0">{row.label}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white text-end flex-1">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Location context photo */}
      {locationPhotoUrl && (
        <div className="card overflow-hidden">
          <p className="text-xs text-slate-500 p-3 pb-1">{t('location.contextPhoto')}</p>
          <div className="aspect-video bg-slate-100 dark:bg-slate-800">
            <img src={locationPhotoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Forgotten interval */}
      <div className="card p-4 flex items-center gap-3">
        <Clock size={18} className="text-slate-400" />
        <span className="text-sm text-slate-500">{t('item.forgottenInterval')}</span>
        <span className="text-sm font-medium text-slate-900 dark:text-white ms-auto">
          {item.forgotten_interval_months} {language === 'ar' ? 'أشهر' : 'months'}
        </span>
      </div>

      {/* QR Code */}
      {item.qr_code && (
        <QRCodeDisplay value={item.qr_code} label={tn(item.name, item.name_ar)} />
      )}
    </div>
  );
}
