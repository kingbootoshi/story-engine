import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        padding: '1rem 2rem'
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to="/app" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
              Dashboard
            </Link>
            <Link to="/app/worlds" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
              Worlds
            </Link>
            <Link to="/app/playground" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
              Playground
            </Link>
            <Link to="/app/api-keys" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
              API Keys
            </Link>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#666' }}>{user?.email}</span>
            <button 
              onClick={handleSignOut}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}