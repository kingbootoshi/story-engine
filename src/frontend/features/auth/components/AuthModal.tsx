import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthModal.styles.css';

/**
 * Props for the AuthModal component
 */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Animated authentication modal component that handles both login and signup
 * Provides smooth transitions between auth modes and form validation
 */
export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // Auth state and form management
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation state
  const [loginSlideOut, setLoginSlideOut] = useState(false);
  const [signupSlideIn, setSignupSlideIn] = useState(false);
  
  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // Auth context for login/signup functionality
  const { signIn, signUp } = useAuth();

  /**
   * Handle visibility animations when modal opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow CSS transitions to work properly
      setTimeout(() => {
        setIsVisible(true);
        // Focus email input after modal is visible
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 300);
      }, 50);
    } else {
      setIsVisible(false);
      // Reset form state when modal closes
      setTimeout(() => {
        resetForm();
      }, 500);
    }
  }, [isOpen]);

  /**
   * Handle click outside to close modal
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  /**
   * Handle escape key to close modal
   */
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

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
        console.debug('[AuthModal] Sign in successful, redirecting to dashboard');
        // Close modal and redirect
        onClose();
        window.location.href = '/app';
      } else {
        // Signup flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password);
        console.debug('[AuthModal] Sign up successful, redirecting to dashboard');
        // Close modal and redirect
        onClose();
        window.location.href = '/app';
      }
    } catch (err) {
      console.error('[AuthModal] Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`auth-modal-overlay ${isVisible ? 'auth-modal-overlay--visible' : ''}`}>
      <div 
        ref={modalRef}
        className={`auth-modal ${isVisible ? 'auth-modal--visible' : ''}`}
      >
        <button 
          className="auth-modal__close" 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        
        <div className="auth-modal__header">
          <h2 className="auth-modal__title">Story Engine</h2>
        </div>
        
        <div className="auth-modal__tabs">
          <div 
            className={`auth-modal__tab ${isLogin && !loginSlideOut ? 'auth-modal__tab--active' : ''}`}
            onClick={() => !isLogin && toggleAuthMode()}
          >
            Login
          </div>
          <div 
            className={`auth-modal__tab ${!isLogin || loginSlideOut ? 'auth-modal__tab--active' : ''}`}
            onClick={() => isLogin && toggleAuthMode()}
          >
            Sign Up
          </div>
        </div>
        
        {error && (
          <div className="auth-modal__error">
            {error}
          </div>
        )}
        
        <div className="auth-forms-container">
          {/* Login Form */}
          <form 
            onSubmit={handleSubmit} 
            className={`auth-form auth-form--login ${loginSlideOut ? 'slide-out' : ''}`}
          >
            <div className="auth-modal__form-group">
              <label htmlFor="login-email" className="auth-modal__label">
                Email
              </label>
              <input
                id="login-email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-modal__input"
                disabled={!isLogin || loginSlideOut}
              />
            </div>
            
            <div className="auth-modal__form-group">
              <label htmlFor="login-password" className="auth-modal__label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-modal__input"
                disabled={!isLogin || loginSlideOut}
              />
            </div>
            
            <button 
              type="submit" 
              className={`auth-modal__button ${isSubmitting ? 'auth-modal__button--submitting' : ''}`}
              disabled={isSubmitting || !isLogin || loginSlideOut}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          {/* Signup Form */}
          <form 
            onSubmit={handleSubmit} 
            className={`auth-form auth-form--signup ${signupSlideIn ? 'slide-in' : ''}`}
          >
            <div className="auth-modal__form-group">
              <label htmlFor="signup-email" className="auth-modal__label">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-modal__input"
                disabled={isLogin || !signupSlideIn}
              />
            </div>
            
            <div className="auth-modal__form-group">
              <label htmlFor="signup-password" className="auth-modal__label">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-modal__input"
                disabled={isLogin || !signupSlideIn}
              />
            </div>
            
            <div className="auth-modal__form-group">
              <label htmlFor="signup-confirm-password" className="auth-modal__label">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-modal__input"
                disabled={isLogin || !signupSlideIn}
              />
            </div>
            
            <button 
              type="submit" 
              className={`auth-modal__button ${isSubmitting ? 'auth-modal__button--submitting' : ''}`}
              disabled={isSubmitting || isLogin || !signupSlideIn}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}