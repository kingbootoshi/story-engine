import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import type { NavItem } from './AppLayout';
import './DesktopHeader.styles.css';

interface DesktopHeaderProps {
  navItems: NavItem[];
  isScrolled: boolean;
}

/**
 * Desktop header component with navigation and user menu
 * Only visible on desktop screens (md and above)
 */
export function DesktopHeader({ navItems, isScrolled }: DesktopHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /**
   * Close user menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.desktop-header__user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
    <header className={`desktop-header ${isScrolled ? 'desktop-header--scrolled' : ''}`}>
      <div className="desktop-header__container">
        {/* Logo */}
        <div className="desktop-header__logo-section">
          <Link to="/app" className="desktop-header__logo-link">
            <span className="desktop-header__logo-icon">
              <span className="material-icons">auto_stories</span>
            </span>
            <span className="desktop-header__logo-text">Story Engine</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="desktop-header__nav">
          <div className="desktop-header__nav-items">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`desktop-header__nav-link ${isActive(item) ? 'desktop-header__nav-link--active' : ''}`}
              >
                <span className="material-icons">{item.icon}</span>
                <span className="desktop-header__nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        
        {/* User Menu */}
        <div className="desktop-header__user-menu-container">
          <button
            className="desktop-header__user-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User menu"
          >
            <span className="material-icons">account_circle</span>
            <span className="desktop-header__user-button-label">{user?.email}</span>
            <span className="material-icons desktop-header__user-button-arrow">
              {isUserMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          
          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="desktop-header__user-dropdown">
              <div className="desktop-header__user-dropdown-info">
                <span className="material-icons">account_circle</span>
                <div>
                  <div className="desktop-header__user-dropdown-email">{user?.email}</div>
                  <div className="desktop-header__user-dropdown-label">Signed in</div>
                </div>
              </div>
              <div className="desktop-header__user-dropdown-divider" />
              <button
                onClick={handleSignOut}
                className="desktop-header__user-dropdown-item desktop-header__user-dropdown-item--danger"
              >
                <span className="material-icons">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 