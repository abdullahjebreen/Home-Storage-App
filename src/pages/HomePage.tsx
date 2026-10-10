import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, QrCode, MapPin, Clock, Package, AlertTriangle, CalendarClock, HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { getPhotoUrlAsync } from '@/lib/image';
import { getDisplayName } from '@/lib/i18n';
import type { ItemWithRelations } from '@/lib/database.types';

export function HomePage() {
  const { household } = useAuth();
  const { t, tn, language } = useI18n();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState<ItemWithRelations[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, totalLocations: 0, lentOut: 0 });
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household) return;
    loadHomeData();
  }, [household]);

  async function loadHomeData() {
    if (!household) return;
    setLoading(true);
    try {
      const [itemsRes, locRes, lentRes] = await Promise.all([
        supabase
          .from('items')
          .select('*, location:locations(*), category:categories(*), owner:household_members(*), item_photos(*)', { count: 'exact' })
          .eq('household_id', household.id)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('locations').select('id', { count: 'exact', head: true }).eq('household_id', household.id),
        supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', household.id)
          .eq('status', 'lent_out'),
      ]);

      const items = (itemsRes.data || []) as unknown as ItemWithRelations[];
      setRecentItems(items);
      setStats({
        totalItems: itemsRes.count || 0,
        totalLocations: locRes.count || 0,
        lentOut: lentRes.count || 0,
      });

      const primaryPhotos = items
        .map((item) => item.item_photos?.find((p) => p.is_primary) || item.item_photos?.[0])
        .filter((p): p is NonNullable<typeof p> => !!p);

      const urlEntries = await Promise.all(
        primaryPhotos.map(async (photo) => {
          const url = await getPhotoUrlAsync(photo.storage_path);
          return [photo.item_id, url] as const;
        })
      );
      setPhotoUrls(Object.fromEntries(urlEntries.filter(([, url]) => url !== null) as [string, string][]));
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { icon: Search, label: t('home.search'), to: '/search', color: 'bg-primary-500' },
    { icon: Plus, label: t('home.addItem'), to: '/add', color: 'bg-accent-500' },
    { icon: QrCode, label: t('home.scanQR'), to: '/station', color: 'bg-slate-600' },
    { icon: MapPin, label: t('home.browseLocations'), to: '/locations', color: 'bg-warning-500' },
  ];

  const smartLinks = [
    { icon: Clock, label: t('home.recentlyAdded'), to: '/search?filter=recent' },
    { icon: HelpCircle, label: t('home.forgottenItems'), to: '/search?filter=forgotten' },
    { icon: AlertTriangle, label: t('home.lowStock'), to: '/search?filter=low_stock' },
    { icon: CalendarClock, label: t('home.expiringSoon'), to: '/search?filter=expiring' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('home.totalItems'), value: stats.totalItems, icon: Package, color: 'text-primary-600' },
          { label: t('home.totalLocations'), value: stats.totalLocations, icon: MapPin, color: 'text-accent-600' },
          { label: t('home.lentOut'), value: stats.lentOut, icon: AlertTriangle, color: 'text-warning-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-3 text-center">
            <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-md group-active:scale-90 transition-transform`}>
              <action.icon size={24} />
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 text-center font-medium leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Do we have this? */}
      <button
        onClick={() => navigate('/search')}
        className="w-full card p-4 flex items-center gap-3 hover:border-primary-300 transition-colors text-start"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center shrink-0">
          <HelpCircle size={20} />
        </div>
        <span className="font-medium text-slate-700 dark:text-slate-200">{t('home.doWeHaveThis')}</span>
      </button>

      {/* Smart links */}
      <div className="grid grid-cols-2 gap-3">
        {smartLinks.map((link) => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="card p-3 flex items-center gap-2.5 hover:border-slate-300 transition-colors text-start"
          >
            <link.icon size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Recently added */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('home.recentlyAdded')}</h2>
        {recentItems.length === 0 ? (
          <div className="card p-8 text-center">
            <Package size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('home.noItemsYet')}</p>
            <button onClick={() => navigate('/add')} className="btn-primary mt-4 text-sm">
              <Plus size={16} />
              {t('home.addFirstItem')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/items/${item.id}`)}
                className="card overflow-hidden text-start group"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                  {photoUrls[item.id] ? (
                    <img
                      src={photoUrls[item.id]}
                      alt={tn(item.name, item.name_ar)}
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
                    {tn(item.name, item.name_ar)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
