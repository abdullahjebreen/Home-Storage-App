import { useState } from 'react';
import { Home, Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppPrefs } from '@/contexts/AppPrefsContext';
import { useI18n } from '@/hooks/useI18n';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useAppPrefs();
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err === 'auth.emailExists' || err.startsWith('auth.') ? t(err as never) : err);
    } else {
      const { error: err } = await signUp(email, password, displayName, householdName, language);
      if (err) setError(err === 'auth.emailExists' || err.startsWith('auth.') ? t(err as never) : err);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top bar with language + theme toggles */}
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
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white shadow-lg mb-3">
              <Home size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('app.name')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('app.tagline')}</p>
          </div>

          <div className="card p-6 sm:p-8">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {t('auth.signIn')}
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {t('auth.signUp')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
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
                </>
              )}

              <div>
                <label className="label-text">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="label-text">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  dir="ltr"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="label-text">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting
                  ? mode === 'signin'
                    ? t('auth.signingIn')
                    : t('auth.signingUp')
                  : mode === 'signin'
                  ? t('auth.signIn')
                  : t('auth.createAccount')}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-primary-600 font-medium hover:underline"
            >
              {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
