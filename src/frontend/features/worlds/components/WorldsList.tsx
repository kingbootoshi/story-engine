import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';
import { WorldSphere } from './WorldSphere';
import './WorldsList.styles.css';

/**
 * Helper types derived from tRPC router for type safety
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;
type World = RouterOutputs['world']['list'][number];

/**
 * Number of worlds to display per page
 */
const WORLDS_PER_PAGE = 8;

/**
 * WorldsList component displays all worlds and allows creating new ones
 */
export function WorldsList() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Form state for new world
  const [newWorld, setNewWorld] = useState({
    name: '',
    description: ''
  });

  /**
   * Fetch worlds on component mount
   */
  useEffect(() => {
    fetchWorlds();
  }, []);

  /**
   * Reset to page 1 when search query changes
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /**
   * Fetch worlds from the API
   */
  const fetchWorlds = async () => {
    try {
      const result = await trpc.world.list.query();
      setWorlds(result);
    } catch (err) {
      console.error('[WorldsList] Failed to fetch worlds:', err);
      setError('Failed to load worlds');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new world
   */
  const createWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const created = await trpc.world.create.mutate(newWorld);
      console.debug('[WorldsList] Created world:', created);
      setShowCreateForm(false);
      setNewWorld({ name: '', description: '' });
      await fetchWorlds();
      
      // Navigate to the new world
      navigate(`/app/worlds/${created.id}`);
    } catch (err) {
      console.error('[WorldsList] Failed to create world:', err);
      setError('Failed to create world');
    }
  };

  /**
   * Filter worlds based on search query
   */
  const filteredWorlds = worlds.filter(world => 
    world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    world.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Calculate pagination
   */
  const totalPages = Math.ceil(filteredWorlds.length / WORLDS_PER_PAGE);
  const startIndex = (currentPage - 1) * WORLDS_PER_PAGE;
  const endIndex = startIndex + WORLDS_PER_PAGE;
  const paginatedWorlds = filteredWorlds.slice(startIndex, endIndex);

  /**
   * Handle page navigation
   */
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="worlds-list">
      <header className="worlds-list__header">
        <div>
          <h1 className="worlds-list__title">Your Story Worlds</h1>
          <p className="worlds-list__subtitle">Create and manage dynamic narrative universes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="worlds-list__create-button"
        >
          {showCreateForm ? (
            <>
              <span className="material-icons">close</span>
              Cancel
            </>
          ) : (
            <>
              <span className="material-icons">add</span>
              Create New World
            </>
          )}
        </button>
      </header>

      {error && (
        <div className="worlds-list__error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="worlds-list__create-form">
          <h2 className="worlds-list__form-title">Create New World</h2>
          <form onSubmit={createWorld}>
            <div className="worlds-list__form-group">
              <label htmlFor="name" className="worlds-list__form-label">
                World Name *
              </label>
              <input
                id="name"
                type="text"
                value={newWorld.name}
                onChange={(e) => setNewWorld({ ...newWorld, name: e.target.value })}
                required
                placeholder="e.g., The Enchanted Kingdom"
                className="worlds-list__form-input"
              />
            </div>

            <div className="worlds-list__form-group">
              <label htmlFor="description" className="worlds-list__form-label">
                Description *
              </label>
              <textarea
                id="description"
                value={newWorld.description}
                onChange={(e) => setNewWorld({ ...newWorld, description: e.target.value })}
                required
                placeholder="Describe your world..."
                rows={4}
                className="worlds-list__form-input worlds-list__form-textarea"
              />
            </div>

            <button
              type="submit"
              className="worlds-list__form-button"
            >
              <span className="material-icons">public</span>
              Create World
            </button>
          </form>
        </div>
      )}

      <div className="worlds-list__search">
        <div className="worlds-list__search-input-container">
          <span className="material-icons worlds-list__search-icon">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worlds..."
            className="worlds-list__search-input"
          />
          {searchQuery && (
            <button 
              className="worlds-list__search-clear" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        <div className="worlds-list__count">
          {filteredWorlds.length} {filteredWorlds.length === 1 ? 'world' : 'worlds'}
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      {isLoading ? (
        <div className="worlds-list__loading">
          <div className="worlds-list__loading-spinner"></div>
          <p>Loading worlds...</p>
        </div>
      ) : filteredWorlds.length === 0 ? (
        <div className="worlds-list__empty">
          {searchQuery ? (
            <>
              <span className="material-icons worlds-list__empty-icon">search_off</span>
              <p>No worlds match your search</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="worlds-list__empty-button"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <span className="material-icons worlds-list__empty-icon">public_off</span>
              <p>You haven't created any worlds yet</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="worlds-list__empty-button"
              >
                Create Your First World
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="worlds-list__grid">
            {paginatedWorlds.map((world) => (
              <Link 
                key={world.id} 
                to={`/app/worlds/${world.id}`}
                className="worlds-list__card"
              >
                <div className="worlds-list__card-sphere">
                  <WorldSphere seed={world.id} />
                </div>
                <div className="worlds-list__card-content">
                  <h3 className="worlds-list__card-title">{world.name}</h3>
                  <p className="worlds-list__card-description">{world.description}</p>
                  <div className="worlds-list__card-footer">
                    <span className="worlds-list__card-date">
                      {new Date(world.created_at).toLocaleDateString()}
                    </span>
                    {world.current_arc_id && (
                      <span className="worlds-list__card-badge">
                        <span className="material-icons">auto_stories</span>
                        Active Arc
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="worlds-list__pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="worlds-list__pagination-button"
                aria-label="Previous page"
              >
                <span className="material-icons">chevron_left</span>
              </button>
              
              <div className="worlds-list__pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`worlds-list__pagination-page ${page === currentPage ? 'worlds-list__pagination-page--active' : ''}`}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="worlds-list__pagination-button"
                aria-label="Next page"
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}