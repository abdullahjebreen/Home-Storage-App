import { useState } from 'react';
import { Home, Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppPrefs } from '@/contexts/AppPrefsContext';
import { useI18n } from '@/hooks/useI18n';

export function CompleteSignUpPage() {
  const { completeSignUp, signOut } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useAppPrefs();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await completeSignUp(displayName, householdName, language);
    if (err) {
      setError(err.startsWith('auth.') || err.startsWith('common.') ? t(err as never) : err);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex justify-end gap-2 p-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="btn-ghost text-sm"
          aria-label="Toggle language"
        >
          <Globe size={18} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
        <button onClick={toggleTheme} className="btn-ghost text-sm" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white shadow-lg mb-3">
              <Home size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('app.name')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('app.tagline')}</p>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t('auth.completeSetup')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.completeSetupDesc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">{t('auth.displayName')}</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label-text">{t('auth.householdName')}</label>
                <input
                  type="text"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="input-field"
                  autoComplete="organization"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? t('auth.signingUp') : t('auth.finishSetup')}
              </button>
            </form>

            <button
              onClick={async () => { await signOut(); }}
              className="w-full text-center text-sm text-slate-500 dark:text-slate-400 mt-4 hover:underline"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
