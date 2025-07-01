import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from './AuthForm';

/**
 * Standalone login page component
 * Redirects to dashboard if already authenticated
 */
export function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <div className="login-container">
        <AuthForm />
      </div>
    </div>
  );
}