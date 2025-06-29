import { useContext } from 'react';
import { AuthContext } from '../components/AuthProvider';

/**
 * Custom hook to access authentication context
 * Provides access to user data and authentication methods
 * 
 * @returns Authentication context with user data and methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    ...context,
    // Add additional helper methods if needed
    isAuthenticated: !!context.user,
  };
}