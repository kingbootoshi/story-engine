import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { MusicControls } from '@/features/audio';
import type { NavItem } from './AppLayout';
import './MobileNavigation.styles.css';

interface MobileNavigationProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile navigation sidebar component
 * Slides in from left with navigation items, music controls, and user info
 */
export function MobileNavigation({ navItems, isOpen, onClose }: MobileNavigationProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Determine if a nav link is active based on the current path
   */
  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`mobile-nav__overlay ${isOpen ? 'mobile-nav__overlay--visible' : ''}`}
        onClick={onClose}
      />

      {/* Navigation Sidebar */}
      <nav className={`mobile-nav ${isOpen ? 'mobile-nav--open' : ''}`}>
        <div className="mobile-nav__header">
          <Link to="/app" className="mobile-nav__logo">
            <span className="material-icons">auto_stories</span>
            <span>Story Engine</span>
          </Link>
          <button
            className="mobile-nav__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="mobile-nav__items">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav__link ${isActive(item) ? 'mobile-nav__link--active' : ''}`}
              onClick={onClose}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="mobile-nav__footer">
          {/* Music Controls */}
          <div className="mobile-nav__music">
            <MusicControls variant="mobile" />
          </div>
          
          <div className="mobile-nav__user">
            <span className="material-icons">account_circle</span>
            <span>{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="mobile-nav__signout"
          >
            <span className="material-icons">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
} 