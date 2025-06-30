import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { MobileHeader } from './MobileHeader';
import { MobileNavigation } from './MobileNavigation';
import './AppLayout.styles.css';

/**
 * Navigation item configuration
 */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

/**
 * Main application layout component
 * Provides navigation and consistent structure for authenticated pages
 * Uses separate components for desktop and mobile experiences
 */
export function AppLayout() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
   * Navigation items configuration
   */
  const navItems: NavItem[] = [
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
        {/* Desktop Header */}
        <DesktopHeader 
          navItems={navItems} 
          isScrolled={isScrolled} 
        />
        
        {/* Mobile Header */}
        <MobileHeader 
          isScrolled={isScrolled}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        {/* Mobile Navigation Sidebar */}
        <MobileNavigation 
          navItems={navItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Main content area */}
        <main className={`app-layout__main ${isTransitioning ? 'app-layout__main--transitioning' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}