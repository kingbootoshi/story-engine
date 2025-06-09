import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { createLogger } from '../../src/core/infra/logger';
import { eventBus } from '../../src/core/infra/eventBus';
import type { WorldAI, AnchorDTO, BeatDTO } from '../../src/modules/world/domain/ports';
import type { World, WorldArc, WorldBeat } from '../../src/modules/world/domain/schema';

// Now import WorldService after setting up spies
import { WorldService } from '../../src/modules/world/application/WorldService';

describe('WorldService.progressArc', () => {
  let worldService: WorldService;
  let worldRepo: InMemoryWorldRepo;
  let worldAI: WorldAI;
  let mockLogger: any;
  let emitSpy: ReturnType<typeof vi.spyOn>;
  
  // Test data
  let testWorld: World;
  let testArc: WorldArc;
  let anchorBeats: WorldBeat[];

  beforeEach(async () => {
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

    // Setup test data
    testWorld = await worldRepo.createWorld({
      name: 'Test World',
      description: 'A world for testing arc progression',
    });
    
    testArc = await worldRepo.createArc(
      testWorld.id,
      'Test Arc',
      'An arc for testing progression',
      'This is a detailed description of the test arc that provides context for beat generation.'
    );

    // Create anchor beats (at indices 0, 7, 14)
    anchorBeats = [];
    const anchorIndices = [0, 7, 14];
    for (const index of anchorIndices) {
      const beat = await worldRepo.createBeat(
        testArc.id,
        index,
        'anchor',
        {
          beat_name: `Anchor ${index}`,
          description: `Anchor beat at index ${index}`,
          world_directives: [`Directive ${index}`],
          emergent_storylines: [`Storyline ${index}`],
        }
      );
      anchorBeats.push(beat);
    }

    // Update world with current arc
    await worldRepo.updateWorld(testWorld.id, { current_arc_id: testArc.id });

    // Spy on eventBus emit
    emitSpy = vi.spyOn(eventBus as any, 'emit');
  });

  afterEach(() => {
    vi.clearAllMocks();
    emitSpy.mockRestore();
  });

  it('should progress arc by creating a dynamic beat', async () => {
    // Arrange
    const mockBeatDTO: BeatDTO = {
      beatName: 'Dynamic Beat 1',
      description: 'First dynamic beat',
      worldDirectives: ['New directive'],
      emergingConflicts: ['Conflict 1'],
      environmentalChanges: ['Change 1'],
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    const result = await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result?.beat_name).toBe('Dynamic Beat 1');
    expect(result?.beat_type).toBe('dynamic');
    expect(result?.beat_index).toBe(1); // First dynamic beat at index 1
  });

  it('should emit world.beat-created event', async () => {
    // Arrange
    const mockBeatDTO: BeatDTO = {
      beatName: 'Dynamic Beat 1',
      description: 'First dynamic beat',
      worldDirectives: ['New directive'],
      emergingConflicts: ['Conflict 1'],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    const beat = await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(emitSpy).toHaveBeenCalledWith('world.beatCreated', {
      worldId: testWorld.id,
      arcId: testArc.id,
      beatId: beat!.id,
      beatIndex: 1,
      beatName: 'Dynamic Beat 1',
    });
  });

  it('should return null when arc is complete (15 beats)', async () => {
    // Arrange - Fill all beats except anchors
    for (let i = 1; i < 15; i++) {
      if (i !== 7 && i !== 14) { // Skip anchor indices
        await worldRepo.createBeat(testArc.id, i, 'dynamic', {
          beat_name: `Beat ${i}`,
          description: `Dynamic beat ${i}`,
          world_directives: [],
          emergent_storylines: [],
        });
      }
    }

    // Mock arc summary for completion
    (worldAI.summarizeArc as any).mockResolvedValueOnce('Arc completed successfully');

    // Act
    const result = await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(result).toBeNull();
    expect(worldAI.summarizeArc).toHaveBeenCalled();
  });

  it('should use recent events when provided', async () => {
    // Arrange
    const recentEvents = 'Major event: Dragon attack\nMinor event: Trade disruption';
    const mockBeatDTO: BeatDTO = {
      beatName: 'Response to Events',
      description: 'Beat responding to recent events',
      worldDirectives: ['Fortify defenses'],
      emergingConflicts: ['Dragon threat'],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
      recentEvents,
    });

    // Assert
    expect(worldAI.generateBeat).toHaveBeenCalledWith(
      expect.objectContaining({
        recentEvents,
      })
    );
  });

  it('should fetch recent events from repo when not provided', async () => {
    // Arrange - Create some events
    await worldRepo.createEvent({
      world_id: testWorld.id,
      arc_id: testArc.id,
      beat_id: anchorBeats[0].id,
      event_type: 'world_event',
      description: 'A major earthquake',
      impact_level: 'major',
    });

    const mockBeatDTO: BeatDTO = {
      beatName: 'Event Response',
      description: 'Responding to world events',
      worldDirectives: [],
      emergingConflicts: [],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(worldAI.generateBeat).toHaveBeenCalledWith(
      expect.objectContaining({
        recentEvents: expect.stringContaining('[MAJOR'),
      })
    );
  });

  it('should update arc current_beat_id when creating beat', async () => {
    // Arrange
    const mockBeatDTO: BeatDTO = {
      beatName: 'Dynamic Beat 1',
      description: 'First dynamic beat',
      worldDirectives: ['New directive'],
      emergingConflicts: ['Conflict 1'],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    const result = await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert beat was created
    expect(result).toBeDefined();
    
    // Check that arc's current_beat_id was updated
    const arc = await worldRepo.getArc(testArc.id);
    expect(arc?.current_beat_id).toBe(result!.id);
    
    // Verify getCurrentBeat returns the new beat
    const currentBeat = await worldRepo.getCurrentBeat(testArc.id);
    expect(currentBeat?.id).toBe(result!.id);
  });

  it('should pass arc detailed description to AI', async () => {
    // Arrange
    const mockBeatDTO: BeatDTO = {
      beatName: 'Contextual Beat',
      description: 'Beat with arc context',
      worldDirectives: [],
      emergingConflicts: [],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(worldAI.generateBeat).toHaveBeenCalledWith(
      expect.objectContaining({
        arcDetailedDescription: 'This is a detailed description of the test arc that provides context for beat generation.',
      })
    );
  });

  // Logger behavior is tested separately in logger.spec.ts

  it('should handle missing next anchor gracefully', async () => {
    // Arrange - Remove the next anchor beat
    worldRepo.clear();
    testWorld = await worldRepo.createWorld({
      name: 'Test World',
      description: 'Test description',
    });
    testArc = await worldRepo.createArc(testWorld.id, 'Test Arc', 'Test idea');
    
    // Only create first anchor
    await worldRepo.createBeat(testArc.id, 0, 'anchor', {
      beat_name: 'First Anchor',
      description: 'First anchor',
      world_directives: [],
      emergent_storylines: [],
    });

    // Act & Assert
    await expect(worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    })).rejects.toThrow('No next anchor point found');
  });

  it('should handle AI generation errors', async () => {
    // Arrange
    const error = new Error('AI service unavailable');
    (worldAI.generateBeat as any).mockRejectedValueOnce(error);

    // Act & Assert
    await expect(worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    })).rejects.toThrow('AI service unavailable');

    // Error logging is tested separately - the important thing is the error is thrown
  });

  it('should fill beats in sequential order', async () => {
    // Arrange - Create beat at index 1, next should be 2
    await worldRepo.createBeat(testArc.id, 1, 'dynamic', {
      beat_name: 'Beat 1',
      description: 'First dynamic beat',
      world_directives: [],
      emergent_storylines: [],
    });

    const mockBeatDTO: BeatDTO = {
      beatName: 'Beat 2',
      description: 'Second dynamic beat',
      worldDirectives: [],
      emergingConflicts: [],
      environmentalChanges: null,
    };
    (worldAI.generateBeat as any).mockResolvedValueOnce(mockBeatDTO);

    // Act
    const result = await worldService.progressArc({
      worldId: testWorld.id,
      arcId: testArc.id,
    });

    // Assert
    expect(result?.beat_index).toBe(2);
    expect(worldAI.generateBeat).toHaveBeenCalledWith(
      expect.objectContaining({
        currentBeatIndex: 2,
      })
    );
  });
});