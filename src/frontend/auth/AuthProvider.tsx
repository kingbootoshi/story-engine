import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextShape {
  session: Session | null;
  user: User | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextShape | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.debug('[AuthProvider] Mounting, checking initial session');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.debug('[AuthProvider] Initial session:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
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
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}