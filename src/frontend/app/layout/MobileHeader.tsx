import { Link } from 'react-router-dom';
import './MobileHeader.styles.css';

interface MobileHeaderProps {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

/**
 * Mobile header component with logo and hamburger menu
 * Only visible on mobile screens (below md breakpoint)
 */
export function MobileHeader({ isScrolled, isMobileMenuOpen, onMobileMenuToggle }: MobileHeaderProps) {
  return (
    <header className={`mobile-header ${isScrolled ? 'mobile-header--scrolled' : ''} ${isMobileMenuOpen ? 'mobile-header--hidden' : ''}`}>
      <div className="mobile-header__container">
        {/* Logo */}
        <div className="mobile-header__logo-section">
          <Link to="/app" className="mobile-header__logo-link">
            <span className="mobile-header__logo-icon">
              <span className="material-icons">auto_stories</span>
            </span>
            <span className="mobile-header__logo-text">Story Engine</span>
          </Link>
        </div>
        
        {/* Hamburger Menu Button */}
        <button
          className="mobile-header__menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <span className="material-icons">menu</span>
        </button>
      </div>
    </header>
  );
} 