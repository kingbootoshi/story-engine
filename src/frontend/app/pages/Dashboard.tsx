import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/shared/lib/trpcClient';
import { WorldSphere } from '@/features/worlds';
import './Dashboard.styles.css';

/**
 * Dashboard page component
 * Serves as the main landing page after authentication
 */
export function Dashboard() {
  const { user } = useAuth();
  
  // Fetch worlds to display stats
  const { data: worlds, isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => trpc.world.list.query(),
  });

  // Count active arcs
  const activeArcsCount = worlds?.filter(world => world.current_arc_id).length || 0;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1 className="dashboard__title">Your Universe Awaits</h1>
          <p className="dashboard__subtitle">
            Welcome back, <span className="dashboard__username">{user?.email?.split('@')[0]}</span>
          </p>
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--worlds">
            <span className="material-icons">public</span>
          </div>
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{isLoading ? '...' : worlds?.length || 0}</h3>
            <p className="dashboard__stat-label">Total Worlds</p>
          </div>
        </div>
        
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--active">
            <span className="material-icons">auto_stories</span>
          </div>
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{isLoading ? '...' : activeArcsCount}</h3>
            <p className="dashboard__stat-label">Active Arcs</p>
          </div>
        </div>
      </div>

      <div className="dashboard__sections">
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">
              <span className="material-icons">public</span>
              Recent Worlds
            </h2>
            <Link to="/app/worlds" className="dashboard__section-link">
              View All
            </Link>
          </div>
          
          {isLoading ? (
            <div className="dashboard__loading">Loading worlds...</div>
          ) : worlds && worlds.length > 0 ? (
            <div className="dashboard__worlds-grid">
              {worlds.slice(0, 3).map((world) => (
                <Link 
                  key={world.id} 
                  to={`/app/worlds/${world.id}`}
                  className="dashboard__world-card"
                >
                  <div className="dashboard__world-sphere">
                    <WorldSphere seed={world.id} />
                  </div>
                  <div className="dashboard__world-info">
                    <h3 className="dashboard__world-name">{world.name}</h3>
                    <p className="dashboard__world-desc">{world.description}</p>
                    {world.current_arc_id && (
                      <span className="dashboard__world-badge">Active Arc</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard__empty">
              <p>You haven't created any worlds yet.</p>
              <Link to="/app/worlds" className="dashboard__create-link">
                Create your first world
              </Link>
            </div>
          )}
        </section>

        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">
              <span className="material-icons">vpn_key</span>
              API Access
            </h2>
            <Link to="/app/api-keys" className="dashboard__section-link">
              Manage Keys
            </Link>
          </div>
          
          <div className="dashboard__api-info">
            <p>
              Use API keys to access your worlds programmatically through our SDK.
            </p>
            <Link to="/app/api-keys" className="dashboard__button">
              <span className="material-icons">add</span>
              Create API Key
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}