import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Household, HouseholdMember } from '@/lib/database.types';
import { useAppPrefs } from './AppPrefsContext';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  member: HouseholdMember | null;
  household: Household | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    householdName: string,
    language: 'en' | 'ar'
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeSignUp: (
    displayName: string,
    householdName: string,
    language: 'en' | 'ar'
  ) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<HouseholdMember | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const { setLanguage, setTheme } = useAppPrefs();
  const signUpInProgress = useRef(false);

  async function loadProfile(userId: string) {
    const { data: memberData } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberData) {
      setMember(memberData as HouseholdMember);
      const memberLang = (memberData as HouseholdMember).language;
      const memberTheme = (memberData as HouseholdMember).theme;
      setLanguage(memberLang);
      setTheme(memberTheme);

      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .eq('id', (memberData as HouseholdMember).household_id)
        .maybeSingle();
      setHousehold(householdData as Household | null);
    } else {
      setMember(null);
      setHousehold(null);
    }
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        if (signUpInProgress.current) return;
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setMember(null);
        setHousehold(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
    householdName: string,
    language: 'en' | 'ar'
  ) {
    signUpInProgress.current = true;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      signUpInProgress.current = false;
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { error: 'auth.emailExists' };
      }
      return { error: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      signUpInProgress.current = false;
      return { error: 'auth.emailExists' };
    }

    const { error: setupErr } = await supabase.rpc('create_household_with_member', {
      p_household_name: householdName,
      p_language: language,
      p_display_name: displayName,
      p_user_id: userId,
    });

    if (setupErr) {
      signUpInProgress.current = false;
      return { error: setupErr.message };
    }

    await loadProfile(userId);
    signUpInProgress.current = false;
    setLoading(false);

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMember(null);
    setHousehold(null);
  }

  async function completeSignUp(
    displayName: string,
    householdName: string,
    language: 'en' | 'ar'
  ) {
    const userId = session?.user?.id;
    if (!userId) {
      return { error: 'common.error' };
    }

    const { error: setupErr } = await supabase.rpc('create_household_with_member', {
      p_household_name: householdName,
      p_language: language,
      p_display_name: displayName,
    });

    if (setupErr) {
      return { error: setupErr.message };
    }
    await loadProfile(userId);

    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, member, household, signIn, signUp, signOut, refreshProfile, completeSignUp }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
