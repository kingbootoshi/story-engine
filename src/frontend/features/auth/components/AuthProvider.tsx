import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabaseClient';

/**
 * Authentication context shape definition
 */
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
   */
  isInitialized: boolean;

  /**
   * Attempts to authenticate the user with e-mail + password credentials.
   */
  signIn(email: string, password: string): Promise<void>;

  /**
   * Creates a new user account with email and password
   */
  signUp(email: string, password: string): Promise<void>;

  /**
   * Logs out the current user and clears local session data.
   */
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextShape | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component that manages user session state
 * Provides authentication methods and user data to child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize auth state and set up auth state change listener
   */
  useEffect(() => {
    console.debug('[AuthProvider] Initializing auth state');
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error getting session:', error);
      }
      
      console.debug('[AuthProvider] Initial session:', session ? 'exists' : 'null');
      
      if (session) {
        console.debug('[AuthProvider] Session user:', session.user.email);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsInitialized(true);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[AuthProvider] Auth state changed:', event, session ? 'authenticated' : 'logged out');
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Clean up subscription on unmount
    return () => {
      console.debug('[AuthProvider] Unmounting');
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    console.debug('[AuthProvider] Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('[AuthProvider] Sign in error:', error.message);
      throw error;
    }
    
    console.debug('[AuthProvider] Sign in successful:', data.session?.user.email);
    // Immediately update state instead of waiting for listener
    setSession(data.session);
    setUser(data.session?.user ?? null);
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string) => {
    console.debug('[AuthProvider] Attempting sign up for:', email);
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('[AuthProvider] Sign up error:', error.message);
      throw error;
    }
    
    console.debug('[AuthProvider] Sign up successful:', data.user?.email);
    
    // Check if email confirmation is required
    if (data.session) {
      // If we get a session, user can log in immediately
      console.debug('[AuthProvider] Session created immediately after sign up');
      setSession(data.session);
      setUser(data.session?.user ?? null);
    } else {
      // Email confirmation required
      console.debug('[AuthProvider] Email confirmation required');
      throw new Error('Please check your email to confirm your account before logging in.');
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    console.debug('[AuthProvider] Signing out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthProvider] Sign out error:', error);
      throw error;
    }
  };

  // Create context value object
  const value: AuthContextShape = {
    session,
    user,
    isInitialized,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}