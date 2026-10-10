import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, Globe, Moon, Sun, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppPrefs } from '@/contexts/AppPrefsContext';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import type { HouseholdMember } from '@/lib/database.types';

export function SettingsPage() {
  const { household, member, signOut, refreshProfile } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useAppPrefs();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    if (!household) return;
    supabase
      .from('household_members')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at')
      .then(({ data }) => setMembers((data || []) as HouseholdMember[]));
  }, [household]);

  async function handleLanguageChange(lang: 'en' | 'ar') {
    setLanguage(lang);
    if (member) {
      await supabase.from('household_members').update({ language: lang }).eq('id', member.id);
      refreshProfile();
    }
  }

  async function handleThemeChange(newTheme: 'light' | 'dark') {
    toggleTheme();
    if (member) {
      await supabase.from('household_members').update({ theme: newTheme }).eq('id', member.id);
      refreshProfile();
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!household || !member) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h1>

      {/* Household info */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Home size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('settings.household')}</h2>
        </div>
        <p className="text-lg font-medium text-slate-900 dark:text-white">{household.name}</p>
        <p className="text-sm text-slate-500 mt-0.5">
          {household.default_language === 'ar' ? 'العربية' : 'English'} · {household.default_reminder_months} {language === 'ar' ? 'أشهر' : 'months'}
        </p>
      </div>

      {/* Account info */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('settings.account')}</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-500">{t('auth.displayName')}</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{member.display_name}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-500">{t('settings.role')}</span>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-lg ${
            member.role === 'admin'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {t(`role.${member.role}` as never)}
          </span>
        </div>
      </div>

      {/* Members */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('settings.members')}</h2>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-sm font-medium text-slate-900 dark:text-white">{m.display_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                m.role === 'admin'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}>
                {t(`role.${m.role}` as never)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-4">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-3">{t('settings.theme')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => theme !== 'light' && handleThemeChange('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
              theme === 'light' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Sun size={18} />
            {t('common.lightMode')}
          </button>
          <button
            onClick={() => theme !== 'dark' && handleThemeChange('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
              theme === 'dark' ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30' : 'border-slate-200 text-slate-500 dark:border-slate-700'
            }`}
          >
            <Moon size={18} />
            {t('common.darkMode')}
          </button>
        </div>

        <h2 className="font-semibold text-slate-900 dark:text-white mb-3 mt-4">{t('settings.language')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
              language === 'en' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Globe size={18} />
            English
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
              language === 'ar' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Globe size={18} />
            العربية
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut} className="btn-danger w-full">
        <LogOut size={18} />
        {t('auth.signOut')}
      </button>
    </div>
  );
}
