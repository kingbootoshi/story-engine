import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// If the developer hasn't provided the required env vars, we log an error but
// allow the app shell to render.  Auth-dependent functionality will throw
// explicit errors when invoked.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Auth] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file. Authentication layer disabled.');
}

// Tiny noop Supabase stub so that the rest of the UI can load without runtime
// errors. Any attempt to actually use auth methods will throw a helpful error.
const stubSupabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
    onAuthStateChange: () => ({ data: null, error: null }),
    signUp: async () => { throw new Error('Supabase not configured'); },
    signInWithPassword: async () => { throw new Error('Supabase not configured'); },
    signOut: async () => { throw new Error('Supabase not configured'); },
  },
} as unknown as ReturnType<typeof createClient>;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : stubSupabase;

export interface User {
  id: string;
  email: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.currentUser = {
        id: user.id,
        email: user.email!
      };
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email!
        };
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

export default AuthService.getInstance();