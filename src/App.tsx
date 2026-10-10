import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppPrefsProvider } from '@/contexts/AppPrefsContext';
import { AuthPage } from '@/pages/AuthPage';
import { AppShell } from '@/components/AppShell';
import { HomePage } from '@/pages/HomePage';
import { LocationsPage } from '@/pages/LocationsPage';
import { ItemFormPage } from '@/pages/ItemFormPage';
import { ItemDetailPage } from '@/pages/ItemDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StationPage } from '@/pages/StationPage';
import { CompleteSignUpPage } from '@/pages/CompleteSignUpPage';

function ProtectedRoutes() {
  const { session, loading, household } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!household) {
    return <CompleteSignUpPage />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/locations/:locationId" element={<LocationsPage />} />
        <Route path="/items/:itemId" element={<ItemDetailPage />} />
        <Route path="/items/:itemId/edit" element={<ItemFormPage />} />
        <Route path="/add" element={<ItemFormPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/station" element={<StationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppPrefsProvider>
      <AuthProvider>
        <HashRouter>
          <ProtectedRoutes />
        </HashRouter>
      </AuthProvider>
    </AppPrefsProvider>
  );
}

export default App;
