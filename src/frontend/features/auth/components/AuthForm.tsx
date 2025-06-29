import { useState, useRef } from 'react';
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
  
  // Auth context for login/signup functionality
  const { signIn, signUp } = useAuth();

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
      }, 300);
    } else {
      // Animate from signup to login
      setSignupSlideIn(false);
      setTimeout(() => {
        setLoginSlideOut(false);
        setIsLogin(true);
      }, 300);
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
      } else {
        // Signup flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password);
      }
    } catch (err) {
      console.error('[AuthForm] Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
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
        {(isLogin || loginSlideOut) && (
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
              />
            </div>
            
            <button 
              type="submit" 
              className={`auth-form__button ${isSubmitting ? 'auth-form__button--submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
        
        {/* Signup Form */}
        {(!isLogin || signupSlideIn) && (
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
              />
            </div>
            
            <button 
              type="submit" 
              className={`auth-form__button ${isSubmitting ? 'auth-form__button--submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}