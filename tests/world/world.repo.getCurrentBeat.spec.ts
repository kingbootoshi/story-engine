import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { randomUUID } from 'crypto';

describe('WorldRepo.getCurrentBeat', () => {
  let repo: InMemoryWorldRepo;
  let worldId: string;
  let arcId: string;

  beforeEach(async () => {
    repo = new InMemoryWorldRepo();
    repo.clear();

    // Create a test world
    const world = await repo.createWorld({
      name: 'Test World',
      description: 'A test world',
      user_id: randomUUID(),
    });
    worldId = world.id;

    // Create a test arc
    const arc = await repo.createArc(
      worldId,
      'Test Arc',
      'A test story arc',
      'This is a detailed description of the test arc'
    );
    arcId = arc.id;
  });

  it('should return null when no beats exist', async () => {
    const currentBeat = await repo.getCurrentBeat(arcId);
    expect(currentBeat).toBeNull();
  });

  it('should return the latest created beat as current', async () => {
    // Create beats in order
    const beat0 = await repo.createBeat(arcId, 0, 'anchor', {
      beat_name: 'Opening',
      description: 'The beginning',
      world_directives: [],
      emergent_storylines: [],
    });

    const beat1 = await repo.createBeat(arcId, 1, 'dynamic', {
      beat_name: 'Rising Action',
      description: 'Things develop',
      world_directives: [],
      emergent_storylines: [],
    });

    const beat7 = await repo.createBeat(arcId, 7, 'anchor', {
      beat_name: 'Midpoint',
      description: 'The turning point',
      world_directives: [],
      emergent_storylines: [],
    });

    // According to the new business rule the pointer should stay at the
    // *dynamic* beat (index 1); anchor index 7 must **not** overwrite it.
    const currentBeat = await repo.getCurrentBeat(arcId);
    expect(currentBeat).toBeDefined();
    expect(currentBeat?.id).toBe(beat1.id);
    expect(currentBeat?.beat_index).toBe(1);
  });

  it('should update current_beat_id when creating new beats', async () => {
    // Create first beat
    const beat0 = await repo.createBeat(arcId, 0, 'anchor', {
      beat_name: 'Opening',
      description: 'The beginning',
      world_directives: [],
      emergent_storylines: [],
    });

    // Check arc has correct current_beat_id
    const arc1 = await repo.getArc(arcId);
    expect(arc1?.current_beat_id).toBe(beat0.id);

    // Create second beat
    const beat1 = await repo.createBeat(arcId, 1, 'dynamic', {
      beat_name: 'Development',
      description: 'Story develops',
      world_directives: [],
      emergent_storylines: [],
    });

    // Check arc updated to new beat
    const arc2 = await repo.getArc(arcId);
    expect(arc2?.current_beat_id).toBe(beat1.id);

    // Verify getCurrentBeat returns the latest
    const currentBeat = await repo.getCurrentBeat(arcId);
    expect(currentBeat?.id).toBe(beat1.id);
  });

  it('should return null for non-existent arc', async () => {
    const currentBeat = await repo.getCurrentBeat(randomUUID());
    expect(currentBeat).toBeNull();
  });

  it('should handle getBeat method correctly', async () => {
    const beat = await repo.createBeat(arcId, 0, 'anchor', {
      beat_name: 'Test Beat',
      description: 'A test beat',
      world_directives: ['Directive 1'],
      emergent_storylines: ['Storyline 1'],
    });

    // Test getBeat with valid ID
    const retrievedBeat = await repo.getBeat(beat.id);
    expect(retrievedBeat).toBeDefined();
    expect(retrievedBeat?.id).toBe(beat.id);
    expect(retrievedBeat?.beat_name).toBe('Test Beat');

    // Test getBeat with invalid ID
    const notFound = await repo.getBeat(randomUUID());
    expect(notFound).toBeNull();
  });

  it('should handle getArcByWorld correctly', async () => {
    // Should return our test arc
    const arc = await repo.getArcByWorld(worldId);
    expect(arc).toBeDefined();
    expect(arc?.id).toBe(arcId);
    expect(arc?.status).toBe('active');

    // Complete the arc
    await repo.completeArc(arcId, 'Arc completed');
    
    // Should return null now
    const noArc = await repo.getArcByWorld(worldId);
    expect(noArc).toBeNull();

    // Create a new active arc
    const newArc = await repo.createArc(worldId, 'New Arc', 'A new story');
    
    // Should return the new arc
    const activeArc = await repo.getArcByWorld(worldId);
    expect(activeArc?.id).toBe(newArc.id);
  });
});