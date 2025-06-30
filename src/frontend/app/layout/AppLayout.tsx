import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import './AppLayout.styles.css';

/**
 * Main application layout component
 * Provides navigation and consistent structure for authenticated pages
 * Features a responsive header with hamburger menu for mobile
 */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Handle scroll to add backdrop blur to header
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Close mobile menu when route changes
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Prevent body scroll when mobile menu is open
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  /**
   * Determine if a nav link is active based on the current path
   */
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
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

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-layout">
      {/* Background video */}
      <video 
        className="app-layout__background" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/worldtree.mp4" type="video/mp4" />
      </video>
      
      {/* Content overlay */}
      <div className="app-layout__overlay">
        {/* Top navigation bar */}
        <header className={`app-layout__header ${isScrolled ? 'app-layout__header--scrolled' : ''}`}>
          <div className="app-layout__header-container">
            {/* Logo */}
            <div className="app-layout__logo-section">
              <Link to="/app" className="app-layout__logo-link">
                <span className="app-layout__logo-icon">
                  <span className="material-icons">auto_stories</span>
                </span>
                <span className="app-layout__logo-text">Story Engine</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="app-layout__nav app-layout__nav--desktop">
              <Link 
                to="/app" 
                className={`app-layout__nav-link ${isActive('/app') && !isActive('/app/worlds') && !isActive('/app/api-keys') ? 'app-layout__nav-link--active' : ''}`}
              >
                <span className="material-icons">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/app/worlds" 
                className={`app-layout__nav-link ${isActive('/app/worlds') ? 'app-layout__nav-link--active' : ''}`}
              >
                <span className="material-icons">public</span>
                <span>Worlds</span>
              </Link>
              <Link 
                to="/app/api-keys" 
                className={`app-layout__nav-link ${isActive('/app/api-keys') ? 'app-layout__nav-link--active' : ''}`}
              >
                <span className="material-icons">vpn_key</span>
                API Keys
              </Link>
              <Link 
                to="/app/api-docs" 
                className={`app-layout__nav-link ${isActive('/app/api-docs') ? 'app-layout__nav-link--active' : ''}`}
              >
                <span className="material-icons">description</span>
                API Docs
              </Link>
            </nav>
            
            {/* User Menu */}
            <div className="app-layout__user-section">
              <div className="app-layout__user-info">
                <div className="app-layout__user-avatar">
                  <span className="material-icons">account_circle</span>
                </div>
                <span className="app-layout__user-email">{user?.email}</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="app-layout__sign-out"
                aria-label="Sign out"
              >
                <span className="material-icons">logout</span>
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="app-layout__mobile-menu-button"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span className="material-icons">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </header>
        
        {/* Mobile Menu Overlay */}
        <div className={`app-layout__mobile-menu ${isMobileMenuOpen ? 'app-layout__mobile-menu--open' : ''}`}>
          <div className="app-layout__mobile-menu-content">
            {/* User Info in Mobile Menu */}
            <div className="app-layout__mobile-user">
              <div className="app-layout__mobile-user-avatar">
                <span className="material-icons">account_circle</span>
              </div>
              <div className="app-layout__mobile-user-info">
                <span className="app-layout__mobile-user-email">{user?.email}</span>
                <span className="app-layout__mobile-user-label">Signed in</span>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="app-layout__mobile-nav">
              <Link 
                to="/app" 
                className={`app-layout__mobile-nav-link ${isActive('/app') && !isActive('/app/worlds') && !isActive('/app/api-keys') ? 'app-layout__mobile-nav-link--active' : ''}`}
              >
                <span className="material-icons">dashboard</span>
                <span>Dashboard</span>
                <span className="material-icons app-layout__mobile-nav-arrow">chevron_right</span>
              </Link>
              <Link 
                to="/app/worlds" 
                className={`app-layout__mobile-nav-link ${isActive('/app/worlds') ? 'app-layout__mobile-nav-link--active' : ''}`}
              >
                <span className="material-icons">public</span>
                <span>Worlds</span>
                <span className="material-icons app-layout__mobile-nav-arrow">chevron_right</span>
              </Link>
              <Link 
                to="/app/api-keys" 
                className={`app-layout__mobile-nav-link ${isActive('/app/api-keys') ? 'app-layout__mobile-nav-link--active' : ''}`}
              >
                <span className="material-icons">vpn_key</span>
                <span>API Keys</span>
                <span className="material-icons app-layout__mobile-nav-arrow">chevron_right</span>
              </Link>
              <Link 
                to="/app/api-docs" 
                className={`app-layout__mobile-nav-link ${isActive('/app/api-docs') ? 'app-layout__mobile-nav-link--active' : ''}`}
              >
                <span className="material-icons">description</span>
                <span>API Docs</span>
                <span className="material-icons app-layout__mobile-nav-arrow">chevron_right</span>
              </Link>
            </nav>
            
            {/* Mobile Sign Out */}
            <div className="app-layout__mobile-footer">
              <button 
                onClick={handleSignOut}
                className="app-layout__mobile-sign-out"
              >
                <span className="material-icons">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}