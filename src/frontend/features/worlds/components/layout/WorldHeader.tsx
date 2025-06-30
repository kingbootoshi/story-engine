import { Link } from 'react-router-dom';

interface WorldHeaderProps {
  error?: string;
}

export function WorldHeader({ error }: WorldHeaderProps) {
  return (
    <>
      <header className="world-detail__header">
        <div className="world-detail__header-content">
          <Link to="/app/worlds" className="world-detail__back-link">
            <span className="material-icons">arrow_back</span>
            Back to Worlds
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