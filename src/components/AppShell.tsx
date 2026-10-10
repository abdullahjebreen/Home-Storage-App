import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, MapPin, Search, Plus, Monitor, Settings, Moon, Sun, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppPrefs } from '@/contexts/AppPrefsContext';
import { useI18n } from '@/hooks/useI18n';
import { useState } from 'react';

export function AppShell() {
  const { member, household, signOut } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useAppPrefs();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/locations', icon: MapPin, label: t('nav.locations') },
    { to: '/search', icon: Search, label: t('nav.search') },
    { to: '/station', icon: Monitor, label: t('nav.station') },
  ];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 start-0 w-64 flex-col border-e border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white">
            <Home size={20} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{t('app.name')}</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/add"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Plus size={20} />
            {t('nav.add')}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Settings size={20} />
            {t('nav.settings')}
          </NavLink>
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="px-3 mb-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {member?.display_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{household?.name}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="btn-ghost text-xs flex-1">
              <Globe size={16} />
              {language === 'en' ? 'ع' : 'EN'}
            </button>
            <button onClick={toggleTheme} className="btn-ghost text-xs flex-1">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={handleSignOut} className="btn-ghost text-xs flex-1 text-error-600">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white">
            <Home size={18} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{t('app.name')}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="btn-ghost !px-2.5">
            <Globe size={18} />
          </button>
          <button onClick={toggleTheme} className="btn-ghost !px-2.5">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="md:ms-64 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-primary-600' : 'text-slate-400'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Center add button */}
          <NavLink
            to="/add"
            className="flex flex-col items-center justify-center -mt-4 w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </NavLink>

          <NavLink
            to="/station"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary-600' : 'text-slate-400'
              }`
            }
          >
            <Monitor size={22} />
            <span className="text-[10px] font-medium">{t('nav.station')}</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary-600' : 'text-slate-400'
              }`
            }
          >
            <Settings size={22} />
            <span className="text-[10px] font-medium">{t('nav.settings')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
