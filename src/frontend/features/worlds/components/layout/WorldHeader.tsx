import { Link } from 'react-router-dom';

interface WorldHeaderProps {
  error?: string;
}

/**
 * Header component for world detail pages
 * Contains navigation back to worlds list and error display
 */
export function WorldHeader({ error }: WorldHeaderProps) {
  return (
    <>
      <header className="world-detail__header">
        <div className="world-detail__header-content">
          <Link to="/app/worlds" className="world-detail__back-button">
            <span className="material-icons">arrow_back</span>
            <span>Back to Worlds</span>
          </Link>
        </div>
      </header>

      {error && (
        <div className="world-detail__error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}
    </>
  );
}