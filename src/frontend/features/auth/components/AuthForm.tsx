import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthForm.styles.css';

/**
 * Props for the AuthForm component
 */
interface AuthFormProps {
  onBack?: () => void;
}

/**
 * Animated authentication form component that handles both login and signup
 * Provides smooth transitions between auth modes and form validation
 */
export function AuthForm({ onBack }: AuthFormProps) {
  // Navigation hook for redirecting after successful auth
  const navigate = useNavigate();
  
  // Auth state and form management
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation state
  const [loginSlideOut, setLoginSlideOut] = useState(false);
  const [signupSlideIn, setSignupSlideIn] = useState(false);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);
  
  // Auth context for login/signup functionality
  const { user, signIn, signUp } = useAuth();

  /**
   * Redirect to dashboard when user is authenticated
   * Now with smooth transition for cached users
   */
  useEffect(() => {
    if (user) {
      console.debug('[AuthForm] User authenticated, preparing smooth transition');
      // Add a delay and transition state for smooth exit
      setIsTransitioningOut(true);
      setTimeout(() => {
        navigate('/app/worlds');
      }, 600); // Match with fade-out animation duration
    }
  }, [user, navigate]);

  /**
   * Reset form state to defaults
   */
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setIsSubmitting(false);
    setIsLogin(true);
    setLoginSlideOut(false);
    setSignupSlideIn(false);
  };

  /**
   * Switch between login and signup modes with animation
   */
  const toggleAuthMode = () => {
    setError(null);
    
    if (isLogin) {
      // Animate from login to signup
      setLoginSlideOut(true);
      setTimeout(() => {
        setSignupSlideIn(true);
        setIsLogin(false);
      }, 200); // Reduced delay for smoother transition
    } else {
      // Animate from signup to login
      setSignupSlideIn(false);
      setTimeout(() => {
        setLoginSlideOut(false);
        setIsLogin(true);
      }, 200); // Reduced delay for smoother transition
    }
  };

  /**
   * Handle form submission for both login and signup
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login flow
        await signIn(email, password);
        // Redirect will happen via the useEffect
      } else {
        // Signup flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password);
        // After signup, show a success message or redirect
      }
    } catch (err) {
      console.error('[AuthForm] Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`auth-form-container ${isTransitioningOut ? 'auth-form-container--exiting' : ''}`}>
      {onBack && (
        <button 
          className="auth-form__back-button" 
          onClick={onBack}
          aria-label="Back to landing page"
        >
          ←
        </button>
      )}
      
      <div className="auth-form__header">
        <h2 className="auth-form__title">Story Engine</h2>
      </div>
      
      <div className="auth-form__tabs">
        <div 
          className={`auth-form__tab ${isLogin && !loginSlideOut ? 'auth-form__tab--active' : ''}`}
          onClick={() => !isLogin && toggleAuthMode()}
        >
          Login
        </div>
        <div 
          className={`auth-form__tab ${!isLogin || loginSlideOut ? 'auth-form__tab--active' : ''}`}
          onClick={() => isLogin && toggleAuthMode()}
        >
          Sign Up
        </div>
      </div>
      
      {error && (
        <div className="auth-form__error">
          {error}
        </div>
      )}
      
      <div className="auth-forms-wrapper">
        {/* Login Form */}
        <form 
          onSubmit={handleSubmit} 
          className={`auth-form__form auth-form__form--login ${loginSlideOut ? 'slide-out' : ''}`}
        >
          <div className="auth-form__form-group">
            <label htmlFor="login-email" className="auth-form__label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-form__input"
              disabled={!isLogin || loginSlideOut}
            />
          </div>
          
          <div className="auth-form__form-group">
            <label htmlFor="login-password" className="auth-form__label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-form__input"
              disabled={!isLogin || loginSlideOut}
            />
          </div>
          
          <button 
            type="submit" 
            className={`auth-form__button ${isSubmitting ? 'auth-form__button--submitting' : ''}`}
            disabled={isSubmitting || !isLogin || loginSlideOut}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Signup Form */}
        <form 
          onSubmit={handleSubmit} 
          className={`auth-form__form auth-form__form--signup ${signupSlideIn ? 'slide-in' : ''}`}
        >
          <div className="auth-form__form-group">
            <label htmlFor="signup-email" className="auth-form__label">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-form__input"
              disabled={isLogin || !signupSlideIn}
            />
          </div>
          
          <div className="auth-form__form-group">
            <label htmlFor="signup-password" className="auth-form__label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-form__input"
              disabled={isLogin || !signupSlideIn}
            />
          </div>
          
          <div className="auth-form__form-group">
            <label htmlFor="signup-confirm-password" className="auth-form__label">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="auth-form__input"
              disabled={isLogin || !signupSlideIn}
            />
          </div>
          
          <button 
            type="submit" 
            className={`auth-form__button ${isSubmitting ? 'auth-form__button--submitting' : ''}`}
            disabled={isSubmitting || isLogin || !signupSlideIn}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}