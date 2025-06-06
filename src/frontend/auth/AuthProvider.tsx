import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextShape {
  /**
   * The current Supabase session, or `null` if the user is logged-out.
   */
  session: Session | null;

  /**
   * Convenience alias for `session?.user` – `null` when unauthenticated.
   */
  user: User | null;

  /**
   * Flag that becomes `true` once the provider has finished the *initial* session lookup.
   *
   * We expose this so caller components (e.g. a private route gate) can _wait_ for the
   * asynchronous `supabase.auth.getSession()` call to resolve instead of performing an
   * eager redirect that would otherwise force the user to log in again on every page
   * refresh.
   */
  isInitialized: boolean;

  /**
   * Attempts to authenticate the user with e-mail + password credentials.
   */
  signIn(email: string, password: string): Promise<void>;

  /**
   * Logs out the current user and clears local session data.
   */
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextShape | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Indicates whether we have completed the first `getSession()` round-trip.
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.debug('[AuthProvider] Mounting, checking initial session');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.debug('[AuthProvider] Initial session:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.debug('[AuthProvider] Auth state changed:', session ? 'authenticated' : 'logged out');
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      console.debug('[AuthProvider] Unmounting');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.debug('[AuthProvider] Attempting sign in');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AuthProvider] Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.debug('[AuthProvider] Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthProvider] Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextShape = {
    session,
    user,
    isInitialized,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}