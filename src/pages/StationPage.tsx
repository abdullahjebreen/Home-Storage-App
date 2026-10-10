import { Monitor } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function StationPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Monitor size={24} className="text-primary-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('nav.station')}</h1>
      </div>
      <div className="card p-12 text-center">
        <Monitor size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">
          {t('nav.station')} — Phase 4
        </p>
        <p className="text-sm text-slate-400 mt-2">
          QR scanning station with IN/OUT controls, family member selection, and keyboard-wedge scanner support.
        </p>
      </div>
    </div>
  );
}
