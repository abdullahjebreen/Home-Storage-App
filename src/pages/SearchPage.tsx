import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, List, Package, Filter, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { getPhotoUrlAsync } from '@/lib/image';
import { fetchLocations } from '@/lib/locations';
import type { ItemWithRelations, Location, Category, HouseholdMember } from '@/lib/database.types';
import { useNavigate } from 'react-router-dom';
import { getLocationName } from '@/lib/i18n';

export function SearchPage() {
  const { household } = useAuth();
  const { t, tn, tl, tc, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<ItemWithRelations[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterImportance, setFilterImportance] = useState('');

  useEffect(() => {
    if (!household) return;
    Promise.all([
      fetchLocations(household.id),
      supabase.from('categories').select('*').eq('household_id', household.id).order('sort_order'),
      supabase.from('household_members').select('*').eq('household_id', household.id).order('display_name'),
    ]).then(([locs, catsRes, memRes]) => {
      setLocations(locs);
      setCategories((catsRes.data || []) as Category[]);
      setMembers((memRes.data || []) as HouseholdMember[]);
    });
  }, [household]);

  const doSearch = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    setHasSearched(true);

    let q = supabase
      .from('items')
      .select('*, location:locations(*), category:categories(*), owner:household_members(*), item_photos(*)')
      .eq('household_id', household.id)
      .neq('status', 'deleted');

    if (query.trim()) {
      const text = query.trim();
      q = q.or(`name.ilike.%${text}%,name_ar.ilike.%${text}%,description.ilike.%${text}%,tags.cs.{${text}}`);
    }
    if (filterCategory) q = q.eq('category_id', filterCategory);
    if (filterLocation) q = q.eq('location_id', filterLocation);
    if (filterOwner) q = q.eq('owner_member_id', filterOwner);
    if (filterCondition) q = q.eq('condition', filterCondition);
    if (filterImportance) q = q.eq('importance', filterImportance);

    q = q.order('name').limit(50);

    const { data } = await q;
    const items = (data || []) as unknown as ItemWithRelations[];
    setResults(items);

    const primaryPhotos = items
      .map((item) => item.item_photos?.find((p) => p.is_primary) || item.item_photos?.[0])
      .filter((p): p is NonNullable<typeof p> => !!p);
    const urlEntries = await Promise.all(
      primaryPhotos.map(async (photo) => [photo.item_id, await getPhotoUrlAsync(photo.storage_path)] as const)
    );
    setPhotoUrls(Object.fromEntries(urlEntries.filter(([, url]) => url !== null) as [string, string][]));
    setLoading(false);
  }, [household, query, filterCategory, filterLocation, filterOwner, filterCondition, filterImportance]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query !== searchParams.get('q')) {
        setSearchParams(query ? { q: query } : {});
      }
      doSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, doSearch]);

  const activeFilters = [filterCategory, filterLocation, filterOwner, filterCondition, filterImportance].filter(Boolean).length;

  function clearFilters() {
    setFilterCategory('');
    setFilterLocation('');
    setFilterOwner('');
    setFilterCondition('');
    setFilterImportance('');
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="input-field ps-10"
            autoFocus
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary !px-3 relative ${activeFilters > 0 ? 'ring-2 ring-primary-300' : ''}`}
        >
          <Filter size={18} />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {hasSearched && !loading && `${results.length} ${t('search.results')}`}
        </p>
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => setView('card')}
            className={`p-1.5 rounded ${view === 'card' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-400'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-400'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900 dark:text-white">{t('search.filters')}</h3>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-sm text-primary-600 flex items-center gap-1">
                <X size={14} />
                {t('search.all')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field text-sm">
              <option value="">{t('item.category')}: {t('search.all')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{tc(c)}</option>)}
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="input-field text-sm">
              <option value="">{t('item.location')}: {t('search.all')}</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{getLocationName(l, language)}</option>)}
            </select>
            <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="input-field text-sm">
              <option value="">{t('item.owner')}: {t('search.all')}</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
            <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} className="input-field text-sm">
              <option value="">{t('item.condition')}: {t('search.all')}</option>
              {['New', 'Excellent', 'Good', 'Worn', 'Damaged', 'Needs Repair'].map((c) => (
                <option key={c} value={c}>{t(`condition.${c.replace(/\s+/g, '')}` as never)}</option>
              ))}
            </select>
          </div>
          <select value={filterImportance} onChange={(e) => setFilterImportance(e.target.value)} className="input-field text-sm">
            <option value="">{t('item.importance')}: {t('search.all')}</option>
            {['Valuable', 'Important', 'Cheap', 'Doubtful Need', 'Garbage', 'Waiting for Disposition'].map((i) => (
              <option key={i} value={i}>{t(`importance.${i.replace(/\s+/g, '')}` as never)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : results.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">{t('search.noResults')}</p>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              className="card overflow-hidden text-start group"
            >
              <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                {photoUrls[item.id] ? (
                  <img src={photoUrls[item.id]} alt={tn(item.name, item.name_ar)} className="w-full h-full object-cover group-active:scale-95 transition-transform" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{tn(item.name, item.name_ar)}</p>
                <p className="text-xs text-slate-500 truncate">{item.quantity} {item.unit}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{tl(item.location)}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              className="card p-3 flex items-center gap-3 text-start w-full hover:border-primary-300 transition-colors"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                {photoUrls[item.id] ? (
                  <img src={photoUrls[item.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={18} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white truncate">{tn(item.name, item.name_ar)}</p>
                <p className="text-xs text-slate-500 truncate">{item.quantity} {item.unit} · {tl(item.location)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
