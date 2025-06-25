import { describe, it, expect } from 'vitest';
import { resolveLocationIdentifier } from './resolveLocationIdentifier';
import type { Location } from '../../modules/location/domain/schema';

describe('resolveLocationIdentifier', () => {
  const mockLocations: Location[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      world_id: 'world-123',
      parent_location_id: null,
      name: 'Ironmist Hollows',
      type: 'region',
      status: 'stable',
      description: 'A mysterious foggy region',
      tags: ['foggy', 'mysterious'],
      relative_x: 0,
      relative_y: 0,
      historical_events: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '987fcdeb-51a2-43d1-9876-543210abcdef',
      world_id: 'world-123',
      parent_location_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Crystal Lake',
      type: 'landmark',
      status: 'thriving',
      description: 'A pristine lake with crystal clear waters',
      tags: ['lake', 'pristine'],
      relative_x: 10,
      relative_y: 20,
      historical_events: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  it('should return UUID unchanged when identifier is already a UUID', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const result = resolveLocationIdentifier(uuid, mockLocations);
    expect(result).toBe(uuid);
  });

  it('should resolve location name to UUID (exact match)', () => {
    const result = resolveLocationIdentifier('Ironmist Hollows', mockLocations);
    expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should resolve location name to UUID (case insensitive)', () => {
    const result = resolveLocationIdentifier('CRYSTAL LAKE', mockLocations);
    expect(result).toBe('987fcdeb-51a2-43d1-9876-543210abcdef');
  });

  it('should resolve location name with extra whitespace', () => {
    const result = resolveLocationIdentifier('  Crystal Lake  ', mockLocations);
    expect(result).toBe('987fcdeb-51a2-43d1-9876-543210abcdef');
  });

  it('should return null for unknown location name', () => {
    const result = resolveLocationIdentifier('Unknown Place', mockLocations);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = resolveLocationIdentifier('', mockLocations);
    expect(result).toBeNull();
  });

  it('should handle empty locations array', () => {
    const result = resolveLocationIdentifier('Any Location', []);
    expect(result).toBeNull();
  });

  it('should validate UUID format correctly', () => {
    // Valid UUIDs
    expect(resolveLocationIdentifier('550e8400-e29b-41d4-a716-446655440000', [])).toBe('550e8400-e29b-41d4-a716-446655440000');
    
    // Invalid UUIDs
    expect(resolveLocationIdentifier('not-a-uuid', mockLocations)).toBeNull();
    expect(resolveLocationIdentifier('550e8400-e29b-41d4-a716', mockLocations)).toBeNull();
    expect(resolveLocationIdentifier('550e8400-e29b-41d4-a716-446655440000-extra', mockLocations)).toBeNull();
  });
});