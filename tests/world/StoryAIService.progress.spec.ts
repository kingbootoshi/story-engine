import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { container } from 'tsyringe';
import type { WorldEventLogged, StoryBeatCreated } from '../../src/modules/world/domain/events';
import type { DomainEvent } from '../../src/core/types';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { randomUUID } from 'crypto';

vi.mock('node-cron', () => ({
  schedule: vi.fn(() => ({ stop: vi.fn() }))
}));

describe('StoryAIService', () => {
  let service: any;
  let worldRepo: InMemoryWorldRepo;
  let worldAI: any;
  let beatCreatedEvents: StoryBeatCreated[] = [];
  let eventBus: any;

  beforeEach(async () => {
    // Import after mocks
    const { StoryAIService } = await import('../../src/modules/world/application/StoryAIService');
    const eventBusModule = await import('../../src/core/infra/eventBus');
    eventBus = eventBusModule.eventBus;
    
    // Clear all event listeners before each test
    eventBus.emitter.removeAllListeners();
    
    container.clearInstances();
    beatCreatedEvents = [];
    
    worldRepo = new InMemoryWorldRepo();
    worldAI = {
      generateBeat: vi.fn().mockResolvedValue({
        beatName: 'Test Beat',
        description: 'A test beat description',
        worldDirectives: ['directive1', 'directive2'],
        emergingConflicts: ['conflict1']
      })
    };

    container.registerInstance('WorldRepo', worldRepo);
    container.registerInstance('WorldAI', worldAI);

    eventBus.on('world.beat.created', (event: DomainEvent<StoryBeatCreated>) => {
      beatCreatedEvents.push(event.payload);
    });

    service = container.resolve(StoryAIService);
  });

  afterEach(() => {
    if (service && service.destroy) {
      service.destroy();
    }
  });

  describe('happy path - three major events trigger beat', () => {
    it('should generate a beat when three major events are received', async () => {
      const worldId = randomUUID();
      const arcId = randomUUID();
      
      const world = await worldRepo.createWorld({
        name: 'Test World',
        description: 'A test world',
        user_id: randomUUID()
      });

      const arc = await worldRepo.createArc(
        world.id,
        'Test Arc',
        'Test story idea',
        'Detailed arc description'
      );

      const anchor = await worldRepo.createBeat(
        arc.id,
        7,
        'anchor',
        {
          beat_name: 'Future Anchor',
          description: 'An anchor beat',
          world_directives: [],
          emergent_storylines: []
        }
      );

      const events: WorldEventLogged[] = [
        {
          v: 1,
          kind: 'world.event.logged',
          worldId: world.id,
          arcId: arc.id,
          beatId: anchor.id,
          eventId: randomUUID(),
          eventType: 'system_event',
          impact: 'major',
          description: 'Major event 1'
        },
        {
          v: 1,
          kind: 'world.event.logged',
          worldId: world.id,
          arcId: arc.id,
          beatId: anchor.id,
          eventId: randomUUID(),
          eventType: 'system_event',
          impact: 'major',
          description: 'Major event 2'
        },
        {
          v: 1,
          kind: 'world.event.logged',
          worldId: world.id,
          arcId: arc.id,
          beatId: anchor.id,
          eventId: randomUUID(),
          eventType: 'system_event',
          impact: 'major',
          description: 'Major event 3'
        }
      ];

      for (const event of events) {
        await service.handleEvent(event);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(beatCreatedEvents).toHaveLength(1);
      expect(beatCreatedEvents[0]).toMatchObject({
        v: 1,
        worldId: world.id,
        beatIndex: 0,
        directives: ['directive1', 'directive2'],
        emergent: ['conflict1']
      });

      expect(worldAI.generateBeat).toHaveBeenCalledOnce();
      expect(worldAI.generateBeat).toHaveBeenCalledWith(
        expect.objectContaining({
          worldName: 'Test World',
          worldDescription: 'A test world',
          currentBeatIndex: 0,
          recentEvents: expect.stringContaining('Major event 1')
        })
      );
    });
  });

  describe('hop guard', () => {
    it('should throw error when event hop limit is exceeded', () => {
      const event: WorldEventLogged = {
        v: 1,
        kind: 'world.event.logged',
        worldId: randomUUID(),
        arcId: randomUUID(),
        beatId: randomUUID(),
        eventId: randomUUID(),
        eventType: 'system_event',
        impact: 'minor',
        description: 'Test event',
        _hop: 9
      };

      expect(() => {
        eventBus.emit('world.event.logged', event);
      }).toThrow('Event hop limit exceeded: 10 hops for topic world.event.logged');
    });
  });

  describe('event size guard', () => {
    it('should throw error when event payload is too large', () => {
      const largeDescription = 'x'.repeat(50_000);
      const event: WorldEventLogged = {
        v: 1,
        kind: 'world.event.logged',
        worldId: randomUUID(),
        arcId: randomUUID(),
        beatId: randomUUID(),
        eventId: randomUUID(),
        eventType: 'system_event',
        impact: 'minor',
        description: largeDescription
      };

      expect(() => {
        eventBus.emit('world.event.logged', event);
      }).toThrow(/Event payload too large/);
    });
  });

  describe('buffer management', () => {
    it('should not generate beat with less than 3 major events', async () => {
      const worldId = randomUUID();
      
      const events: WorldEventLogged[] = [
        {
          v: 1,
          kind: 'world.event.logged',
          worldId,
          arcId: randomUUID(),
          beatId: randomUUID(),
          eventId: randomUUID(),
          eventType: 'system_event',
          impact: 'major',
          description: 'Major event 1'
        },
        {
          v: 1,
          kind: 'world.event.logged',
          worldId,
          arcId: randomUUID(),
          beatId: randomUUID(),
          eventId: randomUUID(),
          eventType: 'system_event',
          impact: 'minor',
          description: 'Minor event'
        }
      ];

      for (const event of events) {
        await service.handleEvent(event);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(beatCreatedEvents).toHaveLength(0);
      expect(worldAI.generateBeat).not.toHaveBeenCalled();
    });

    it('should clear buffer after successful flush', async () => {
      const world = await worldRepo.createWorld({
        name: 'Test World',
        description: 'A test world',
        user_id: randomUUID()
      });

      const arc = await worldRepo.createArc(
        world.id,
        'Test Arc',
        'Test story idea'
      );

      await worldRepo.createBeat(
        arc.id,
        7,
        'anchor',
        {
          beat_name: 'Future Anchor',
          description: 'An anchor beat',
          world_directives: [],
          emergent_storylines: []
        }
      );

      const events: WorldEventLogged[] = Array(3).fill(null).map(() => ({
        v: 1 as const,
        kind: 'world.event.logged',
        worldId: world.id,
        arcId: arc.id,
        beatId: randomUUID(),
        eventId: randomUUID(),
        eventType: 'system_event' as const,
        impact: 'major' as const,
        description: 'Major event'
      }));

      for (const event of events) {
        await service.handleEvent(event);
      }

      // Wait for auto-flush to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have created 1 beat
      expect(beatCreatedEvents).toHaveLength(1);
      expect(worldAI.generateBeat).toHaveBeenCalledOnce();

      // Add a new minor event
      const newEvent: WorldEventLogged = {
        v: 1,
        kind: 'world.event.logged',
        worldId: world.id,
        arcId: arc.id,
        beatId: randomUUID(),
        eventId: randomUUID(),
        eventType: 'system_event',
        impact: 'minor',
        description: 'After flush'
      };

      await service.handleEvent(newEvent);
      
      // Manual flush with only 1 minor event should do nothing
      await service.flush('timer');
      
      // Should still only have 1 beat from the first flush
      expect(beatCreatedEvents).toHaveLength(1);
      expect(worldAI.generateBeat).toHaveBeenCalledOnce();
    });
  });
});