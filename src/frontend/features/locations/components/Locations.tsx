import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Location = RouterOutputs['location']['list'][number];
type HistoricalEvent = RouterOutputs['location']['getHistory'][number];

export function Locations() {
  const { worldId } = useParams<{ worldId: string }>();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationHistory, setLocationHistory] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEnrichForm, setShowEnrichForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state for creating new location
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'city' as 'region' | 'city' | 'landmark' | 'wilderness',
    status: 'stable' as 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost',
    description: '',
    parent_location_id: null as string | null,
    tags: [] as string[],
    tagInput: ''
  });

  // Form state for enrichment
  const [enrichContext, setEnrichContext] = useState('');

  const locationTypeColors = {
    region: '#FF6B6B',
    city: '#4ECDC4',
    landmark: '#45B7D1',
    wilderness: '#96CEB4'
  };

  const statusColors = {
    thriving: '#4CAF50',
    stable: '#2196F3',
    declining: '#FF9800',
    ruined: '#F44336',
    abandoned: '#9E9E9E',
    lost: '#424242'
  };

  useEffect(() => {
    if (worldId) {
      fetchLocations();
    }
  }, [worldId]);

  const fetchLocations = async () => {
    try {
      const data = await trpc.location.list.query({ worldId: worldId! });
      setLocations(data);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationHistory = async (locationId: string) => {
    try {
      const history = await trpc.location.getHistory.query({ 
        locationId, 
        limit: 20 
      });
      setLocationHistory(history);
    } catch (err) {
      console.error('Failed to fetch location history:', err);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    fetchLocationHistory(location.id);
  };

  const handleSearch = async () => {
    try {
      const results = await trpc.location.search.query({
        worldId: worldId!,
        query: searchQuery,
        tags: searchTags.length > 0 ? searchTags : undefined
      });
      setLocations(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldId) return;

    try {
      const created = await trpc.location.create.mutate({
        world_id: worldId,
        parent_location_id: newLocation.parent_location_id,
        name: newLocation.name,
        type: newLocation.type,
        status: newLocation.status,
        description: newLocation.description,
        tags: newLocation.tags
      });
      
      setLocations([...locations, created]);
      setShowCreateForm(false);
      setNewLocation({
        name: '',
        type: 'city',
        status: 'stable',
        description: '',
        parent_location_id: null,
        tags: [],
        tagInput: ''
      });
    } catch (err) {
      console.error('Failed to create location:', err);
      setError('Failed to create location');
    }
  };

  const handleEnrichLocation = async () => {
    if (!selectedLocation || !worldId) return;

    try {
      const enriched = await trpc.location.enrichWithAI.mutate({
        locationId: selectedLocation.id,
        worldContext: enrichContext || 'A fantasy world with magic and adventure'
      });
      
      // Update the location in our list
      setLocations(locations.map(loc => 
        loc.id === enriched.id ? enriched : loc
      ));
      setSelectedLocation(enriched);
      setShowEnrichForm(false);
      setEnrichContext('');
    } catch (err) {
      console.error('Failed to enrich location:', err);
      setError('Failed to enrich location');
    }
  };

  const handleAddTag = () => {
    if (newLocation.tagInput.trim()) {
      setNewLocation({
        ...newLocation,
        tags: [...newLocation.tags, newLocation.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewLocation({
      ...newLocation,
      tags: newLocation.tags.filter(t => t !== tag)
    });
  };

  // Filter locations based on type and status
  const filteredLocations = locations.filter(loc => {
    if (filterType !== 'all' && loc.type !== filterType) return false;
    if (filterStatus !== 'all' && loc.status !== filterStatus) return false;
    return true;
  });

  // Group locations by type for display
  const locationsByType = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.type]) acc[loc.type] = [];
    acc[loc.type].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading locations...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link to={`/app/worlds/${worldId}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Back to World
        </Link>
        <h1>Locations</h1>
        <p style={{ color: '#666' }}>
          Manage and explore locations in this world
        </p>
      </header>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          padding: '1rem',
          marginBottom: '1rem',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or description..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Types</option>
            <option value="region">Regions</option>
            <option value="city">Cities</option>
            <option value="landmark">Landmarks</option>
            <option value="wilderness">Wilderness</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Status</option>
            <option value="thriving">Thriving</option>
            <option value="stable">Stable</option>
            <option value="declining">Declining</option>
            <option value="ruined">Ruined</option>
            <option value="abandoned">Abandoned</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        
        <button
          onClick={handleSearch}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
        
        <button
          onClick={fetchLocations}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
        
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Location
        </button>
      </div>

      {/* Create Location Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '2rem'
        }}>
          <h3>Create New Location</h3>
          <form onSubmit={handleCreateLocation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Parent Location
                </label>
                <select
                  value={newLocation.parent_location_id || ''}
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    parent_location_id: e.target.value || null 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">None (Top Level)</option>
                  {locations
                    .filter(loc => loc.type === 'region')
                    .map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Type *
                </label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    type: e.target.value as any 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="region">Region</option>
                  <option value="city">City</option>
                  <option value="landmark">Landmark</option>
                  <option value="wilderness">Wilderness</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Status *
                </label>
                <select
                  value={newLocation.status}
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    status: e.target.value as any 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="thriving">Thriving</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                  <option value="ruined">Ruined</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                Description *
              </label>
              <textarea
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                Tags
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newLocation.tagInput}
                  onChange={(e) => setNewLocation({ ...newLocation, tagInput: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {newLocation.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#e3f2fd',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#666'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Location
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Locations List */}
        <div>
          <h2>Locations ({filteredLocations.length})</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {Object.entries(locationsByType).map(([type, locs]) => (
              <div key={type} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  color: locationTypeColors[type as keyof typeof locationTypeColors]
                }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s ({locs.length})
                </h3>
                {locs.map(location => (
                  <div
                    key={location.id}
                    onClick={() => handleSelectLocation(location)}
                    style={{
                      backgroundColor: selectedLocation?.id === location.id ? '#e3f2fd' : 'white',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{location.name}</strong>
                      <span style={{
                        backgroundColor: statusColors[location.status],
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}>
                        {location.status}
                      </span>
                    </div>
                    {location.tags && location.tags.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {(location.tags ?? []).map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: '#f5f5f5',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              marginRight: '0.25rem'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Location Details */}
        <div>
          {selectedLocation ? (
            <>
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ marginTop: 0 }}>{selectedLocation.name}</h2>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{
                        backgroundColor: locationTypeColors[selectedLocation.type],
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {selectedLocation.type}
                      </span>
                      <span style={{
                        backgroundColor: statusColors[selectedLocation.status],
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {selectedLocation.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEnrichForm(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Enrich with AI
                  </button>
                </div>
                
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedLocation.description}
                </p>
                
                {selectedLocation.tags && selectedLocation.tags.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Tags:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(selectedLocation.tags ?? []).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: '#e3f2fd',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '16px',
                            fontSize: '0.875rem'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  Created: {new Date(selectedLocation.created_at).toLocaleDateString()}
                  {selectedLocation.last_significant_change && (
                    <> • Last significant change: {new Date(selectedLocation.last_significant_change).toLocaleDateString()}</>
                  )}
                </div>
              </div>

              {/* AI Enrichment Form */}
              {showEnrichForm && (
                <div style={{
                  backgroundColor: '#fff8e1',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #ffb74d',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ marginTop: 0 }}>Enrich Description with AI</h4>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    World Context (optional)
                  </label>
                  <textarea
                    value={enrichContext}
                    onChange={(e) => setEnrichContext(e.target.value)}
                    placeholder="Provide additional context about the world..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleEnrichLocation}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Enrich
                    </button>
                    <button
                      onClick={() => setShowEnrichForm(false)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Historical Events */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <h3 style={{ marginTop: 0 }}>Historical Events</h3>
                {locationHistory.length === 0 ? (
                  <p style={{ color: '#666' }}>No historical events recorded</p>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {locationHistory.map((event, index) => (
                      <div
                        key={index}
                        style={{
                          borderLeft: '3px solid #2196F3',
                          paddingLeft: '1rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          marginBottom: '0.25rem'
                        }}>
                          {new Date(event.timestamp).toLocaleString()}
                          {event.beat_index !== undefined && (
                            <> • Beat {event.beat_index}</>
                          )}
                        </div>
                        <p style={{ margin: 0 }}>{event.event}</p>
                        {event.previous_status && (
                          <div style={{
                            marginTop: '0.25rem',
                            fontSize: '0.875rem',
                            color: '#666'
                          }}>
                            Status: {event.previous_status} → {selectedLocation.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '3rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              textAlign: 'center',
              color: '#666'
            }}>
              Select a location to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}