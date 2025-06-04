import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../shared/utils/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        set({ 
          user: data.user, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      signUp: async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        // User needs to confirm email before being authenticated
        set({ isLoading: false })
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },

      checkSession: async () => {
        set({ isLoading: true })
        
        const { data: { session } } = await supabase.auth.getSession()
        
        set({
          user: session?.user ?? null,
          isAuthenticated: !!session,
          isLoading: false,
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)