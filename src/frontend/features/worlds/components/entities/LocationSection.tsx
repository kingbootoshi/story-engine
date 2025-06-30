import type { GroupedLocations, Location } from '../../types';

interface LocationSectionProps {
  groupedLocations: GroupedLocations;
  totalLocationCount: number;
  onLocationClick: (location: Location) => void;
}

export function LocationSection({ groupedLocations, totalLocationCount, onLocationClick }: LocationSectionProps) {
  return (
    <div className="world-detail__entity-section">
      <div className="world-detail__section-header">
        <h2 className="world-detail__section-title">
          <span className="material-icons">place</span>
          Locations ({totalLocationCount})
        </h2>
      </div>
      
      <div className="world-detail__locations-content">
        {Object.entries(groupedLocations).length > 0 ? (
          <>
            {/* Regions */}
            {groupedLocations['region'] && (
              <div className="world-detail__location-group">
                <h3 className="world-detail__location-group-title">
                  Regions ({groupedLocations['region'].length})
                </h3>
                <ul className="world-detail__location-list">
                  {groupedLocations['region'].map(location => (
                    <li key={location.id} className="world-detail__location-item" onClick={() => onLocationClick(location)}>
                      <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                      {location.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Cities */}
            {groupedLocations['city'] && (
              <div className="world-detail__location-group">
                <h3 className="world-detail__location-group-title">
                  Cities ({groupedLocations['city'].length})
                </h3>
                <ul className="world-detail__location-list">
                  {groupedLocations['city'].map(location => (
                    <li key={location.id} className="world-detail__location-item" onClick={() => onLocationClick(location)}>
                      <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                      {location.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Landmarks */}
            {groupedLocations['landmark'] && (
              <div className="world-detail__location-group">
                <h3 className="world-detail__location-group-title">
                  Landmarks ({groupedLocations['landmark'].length})
                </h3>
                <ul className="world-detail__location-list">
                  {groupedLocations['landmark'].map(location => (
                    <li key={location.id} className="world-detail__location-item" onClick={() => onLocationClick(location)}>
                      <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                      {location.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Wilderness */}
            {groupedLocations['wilderness'] && (
              <div className="world-detail__location-group">
                <h3 className="world-detail__location-group-title">
                  Wilderness ({groupedLocations['wilderness'].length})
                </h3>
                <ul className="world-detail__location-list">
                  {groupedLocations['wilderness'].map(location => (
                    <li key={location.id} className="world-detail__location-item" onClick={() => onLocationClick(location)}>
                      <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                      {location.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="world-detail__empty-message">
            No locations found for this world
          </div>
        )}
      </div>
    </div>
  );
}