import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import './AppLayout.styles.css';

/**
 * Main application layout component
 * Provides navigation and consistent structure for authenticated pages
 */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        <header className="app-layout__header">
          <div className="app-layout__logo">
            <Link to="/app" className="app-layout__logo-link">
              Story Engine
            </Link>
          </div>
          
          <nav className="app-layout__nav">
            <Link 
              to="/app" 
              className={`app-layout__nav-link ${isActive('/app') && !isActive('/app/worlds') && !isActive('/app/api-keys') ? 'app-layout__nav-link--active' : ''}`}
            >
              <span className="material-icons">dashboard</span>
              Dashboard
            </Link>
            <Link 
              to="/app/worlds" 
              className={`app-layout__nav-link ${isActive('/app/worlds') ? 'app-layout__nav-link--active' : ''}`}
            >
              <span className="material-icons">public</span>
              Worlds
            </Link>
            <Link 
              to="/app/api-keys" 
              className={`app-layout__nav-link ${isActive('/app/api-keys') ? 'app-layout__nav-link--active' : ''}`}
            >
              <span className="material-icons">vpn_key</span>
              API Keys
            </Link>
          </nav>
          
          <div className="app-layout__user">
            <div className="app-layout__user-email">{user?.email}</div>
            <button 
              onClick={handleSignOut}
              className="app-layout__sign-out"
            >
              <span className="material-icons">logout</span>
              Sign Out
            </button>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}