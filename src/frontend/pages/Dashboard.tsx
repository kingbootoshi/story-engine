import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Dashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[Dashboard] Sign out failed:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h1>Story Engine Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Welcome, {user?.email}</span>
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem' }}>
            Sign Out
          </button>
        </div>
      </header>

      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '2rem' }}>
            <Link to="/worlds" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>
              🌍 Story Worlds
            </Link>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              Create and manage dynamic story worlds with evolving narratives
            </p>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <Link to="/playground" style={{ fontSize: '1.2rem' }}>
              🛠️ API Playground
            </Link>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              Test tRPC procedures with dynamic inputs
            </p>
          </li>
        </ul>
      </nav>
    </div>
  );
}