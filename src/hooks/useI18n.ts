import { useCallback } from 'react';
import { useAppPrefs } from '@/contexts/AppPrefsContext';
import { translate, type TranslationKey, type Language, getCategoryName, getLocationName, getDisplayName } from '@/lib/i18n';

export function useI18n() {
  const { language } = useAppPrefs();

  const t = useCallback((key: TranslationKey) => translate(key, language), [language]);
  const tc = useCallback(
    (cat: { name: string; name_ar: string | null } | null | undefined) =>
      getCategoryName(cat, language),
    [language]
  );
  const tl = useCallback(
    (loc: { name: string; name_ar: string | null } | null | undefined) =>
      getLocationName(loc, language),
    [language]
  );
  const tn = useCallback(
    (name: string | null, nameAr: string | null) => getDisplayName(name, nameAr, language),
    [language]
  );

  return { t, tc, tl, tn, language };
}

export type { Language };
