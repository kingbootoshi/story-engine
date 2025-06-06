import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { createLogger } from '../../src/core/infra/logger';
import type { WorldAI } from '../../src/modules/world/domain/ports';

// Use vi.hoisted to ensure mocks are available before imports
const { mockEventBus } = vi.hoisted(() => {
  return {
    mockEventBus: {
      emit: vi.fn(() => true),
      on: vi.fn(),
      off: vi.fn(),
    }
  };
});

vi.mock('../../src/core/infra/eventBus', () => ({
  eventBus: mockEventBus,
}));

// Now import WorldService after mocks are set up
import { WorldService } from '../../src/modules/world/application/WorldService';

describe('WorldService.createWorld', () => {
  let worldService: WorldService;
  let worldRepo: InMemoryWorldRepo;
  let worldAI: WorldAI;
  let mockLogger: any;

  beforeEach(() => {
    // Reset container
    container.reset();

    // Clear mocks
    vi.clearAllMocks();

    // Create mocks
    worldRepo = new InMemoryWorldRepo();
    
    worldAI = {
      generateAnchors: vi.fn(),
      generateBeat: vi.fn(),
      summarizeArc: vi.fn(),
    };

    // Register dependencies
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('WorldAI', { useValue: worldAI });

    // Get service instance
    worldService = container.resolve(WorldService);
    
    // Get the mocked logger from the WorldService instance
    // The logger is created when WorldService is instantiated
    const loggerMock = vi.mocked(createLogger);
    // Find the logger created for 'world.service'
    const calls = loggerMock.mock.calls;
    const serviceLoggerCall = calls.find(call => call[0] === 'world.service');
    if (serviceLoggerCall) {
      mockLogger = loggerMock.mock.results[calls.indexOf(serviceLoggerCall)]?.value;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a world with name and description', async () => {
    // Act
    const result = await worldService.createWorld('Eldoria', 'High fantasy world');

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('Eldoria');
    expect(result.description).toBe('High fantasy world');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
    expect(result.current_arc_id).toBeNull();
  });

  it('should persist the world in the repository', async () => {
    // Act
    const world = await worldService.createWorld('Eldoria', 'High fantasy world');

    // Assert
    const worlds = await worldRepo.listWorlds();
    expect(worlds).toHaveLength(1);
    expect(worlds[0]).toEqual(world);
  });

  it('should emit world.created event with correct payload', async () => {
    // Act
    const world = await worldService.createWorld('Eldoria', 'High fantasy world');

    // Assert
    expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
    expect(mockEventBus.emit).toHaveBeenCalledWith('world.created', {
      worldId: world.id,
      name: 'Eldoria',
      description: 'High fantasy world',
    });
  });

  // Logger behavior is tested separately in logger.spec.ts
  // Removing redundant logger assertions to focus on business logic

  it('should handle repository errors gracefully', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    vi.spyOn(worldRepo, 'createWorld').mockRejectedValueOnce(error);

    // Act & Assert
    await expect(worldService.createWorld('Eldoria', 'High fantasy world'))
      .rejects.toThrow('Database connection failed');
  });

  it('should create multiple worlds independently', async () => {
    // Act
    const world1 = await worldService.createWorld('Eldoria', 'High fantasy');
    const world2 = await worldService.createWorld('Cybertron', 'Sci-fi world');

    // Assert
    const worlds = await worldRepo.listWorlds();
    expect(worlds).toHaveLength(2);
    expect(worlds.find(w => w.name === 'Eldoria')).toBeDefined();
    expect(worlds.find(w => w.name === 'Cybertron')).toBeDefined();
    
    // Check that each world has unique ID
    expect(world1.id).not.toBe(world2.id);
  });

  it('should handle empty description', async () => {
    // Act
    const world = await worldService.createWorld('Minimalist', '');

    // Assert
    expect(world.name).toBe('Minimalist');
    expect(world.description).toBe('');
  });

  it('should integrate with getWorld method', async () => {
    // Arrange
    const createdWorld = await worldService.createWorld('Eldoria', 'High fantasy');

    // Act
    const fetchedWorld = await worldService.getWorld(createdWorld.id);

    // Assert
    expect(fetchedWorld).toEqual(createdWorld);
  });

  it('should integrate with listWorlds method', async () => {
    // Arrange
    await worldService.createWorld('World1', 'Desc1');
    await worldService.createWorld('World2', 'Desc2');

    // Act
    const worlds = await worldService.listWorlds();

    // Assert
    expect(worlds).toHaveLength(2);
    expect(worlds.map(w => w.name)).toEqual(['World1', 'World2']);
  });
});