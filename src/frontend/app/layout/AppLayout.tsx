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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
   * Handle route transitions with smooth animation
   */
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  /**
   * Close mobile menu when route changes
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Close user menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.app-layout__user-menu-container')) {
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
   * Navigation items configuration
   */
  const navItems = [
    {
      path: '/app',
      label: 'Dashboard',
      icon: 'dashboard',
      exact: true // Only active when exactly at /app
    },
    {
      path: '/app/worlds',
      label: 'Worlds',
      icon: 'public',
      exact: false
    },
    {
      path: '/app/api-docs',
      label: 'Docs',
      icon: 'description',
      exact: false
    },
    {
      path: '/app/api-keys',
      label: 'API Keys',
      icon: 'vpn_key',
      exact: false
    }
  ];

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
        {/* Mobile menu overlay */}
        <div 
          className={`app-layout__mobile-overlay ${isMobileMenuOpen ? 'app-layout__mobile-overlay--visible' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Top navigation bar */}
        <header className={`app-layout__header ${isScrolled ? 'app-layout__header--scrolled' : ''} ${isMobileMenuOpen ? 'app-layout__header--hidden' : ''}`}>
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
              <div className="app-layout__nav-items">
                {navItems.map(item => {
                  const active = item.exact 
                    ? location.pathname === item.path 
                    : isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`app-layout__nav-link ${active ? 'app-layout__nav-link--active' : ''}`}
                    >
                      <span className="material-icons">{item.icon}</span>
                      <span className="app-layout__nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
            
            {/* Mobile Hamburger Button */}
            <button
              className="app-layout__mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <span className="material-icons">menu</span>
            </button>
            
            {/* User Menu */}
            <div className="app-layout__user-menu-container">
              <button
                className="app-layout__user-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <span className="material-icons">account_circle</span>
                <span className="app-layout__user-button-label">{user?.email}</span>
                <span className="material-icons app-layout__user-button-arrow">
                  {isUserMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="app-layout__user-dropdown">
                  <div className="app-layout__user-dropdown-info">
                    <span className="material-icons">account_circle</span>
                    <div>
                      <div className="app-layout__user-dropdown-email">{user?.email}</div>
                      <div className="app-layout__user-dropdown-label">Signed in</div>
                    </div>
                  </div>
                  <div className="app-layout__user-dropdown-divider" />
                  <button
                    onClick={handleSignOut}
                    className="app-layout__user-dropdown-item app-layout__user-dropdown-item--danger"
                  >
                    <span className="material-icons">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Sidebar */}
        <nav className={`app-layout__mobile-nav ${isMobileMenuOpen ? 'app-layout__mobile-nav--open' : ''}`}>
          <div className="app-layout__mobile-nav-header">
            <Link to="/app" className="app-layout__mobile-nav-logo">
              <span className="material-icons">auto_stories</span>
              <span>Story Engine</span>
            </Link>
            <button
              className="app-layout__mobile-nav-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <div className="app-layout__mobile-nav-items">
            {navItems.map(item => {
              const active = item.exact 
                ? location.pathname === item.path 
                : isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`app-layout__mobile-nav-link ${active ? 'app-layout__mobile-nav-link--active' : ''}`}
                >
                  <span className="material-icons">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="app-layout__mobile-nav-footer">
            <div className="app-layout__mobile-nav-user">
              <span className="material-icons">account_circle</span>
              <span>{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="app-layout__mobile-nav-signout"
            >
              <span className="material-icons">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
        
        {/* Main content area */}
        <main className={`app-layout__main ${isTransitioning ? 'app-layout__main--transitioning' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}