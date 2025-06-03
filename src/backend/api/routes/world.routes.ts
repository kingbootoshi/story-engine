import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import supabaseService from '../../services/supabase.service';
import worldArcService from '../../services/worldArc.service';
import { createLogger } from '../../../shared/utils/logger';

const logger = createLogger('world.routes');
const router = Router();

function asyncHandler<T = any>(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<T>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post('/', asyncHandler(async (req, res) => {
  logger.logAPICall('POST', '/api/worlds', req.body);
  
  const { name, description } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  const world = await supabaseService.createWorld(name, description);
  
  logger.logAPICall('POST', '/api/worlds', req.body, { status: 201, data: world });
  res.status(201).json(world);
}));

router.get('/:worldId', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  logger.logAPICall('GET', `/api/worlds/${worldId}`);
  
  try {
    const worldState = await worldArcService.getWorldState(worldId);
    if (!worldState.world) {
      return res.status(404).json({ error: 'World not found' });
    }
    res.json(worldState);
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'World not found' });
    }
    throw error;
  }
}));

router.post('/:worldId/arcs', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const { storyIdea } = req.body;
  
  const world = await supabaseService.getWorld(worldId);
  if (!world) {
    return res.status(404).json({ error: 'World not found' });
  }

  const result = await worldArcService.createNewArc({
    worldId,
    worldName: world.name,
    worldDescription: world.description,
    storyIdea
  });

  res.status(201).json(result);
}));

router.get('/:worldId/arcs', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const arcs = await supabaseService.getWorldArcs(worldId);
  res.json(arcs);
}));

router.get('/arcs/:arcId/beats', asyncHandler(async (req, res) => {
  const { arcId } = req.params;
  logger.logAPICall('GET', `/api/arcs/${arcId}/beats`);
  const beats = await supabaseService.getArcBeats(arcId);
  logger.success('Returned beats', { arcId, count: beats.length });
  res.json(beats);
}));

router.post('/arcs/:arcId/progress', asyncHandler(async (req, res) => {
  const { arcId } = req.params;
  logger.logAPICall('POST', `/api/arcs/${arcId}/progress`, req.body);

  // Look up arc to obtain worldId
  const arc = await supabaseService.getArc(arcId);
  if (!arc) return res.status(404).json({ error: 'Arc not found' });

  const { recentEvents } = req.body;

  const beat = await worldArcService.progressArc({
    worldId: arc.world_id,
    arcId,
    recentEvents,
  });

  if (!beat) {
    return res.json({ 
      message: 'Arc is complete', 
      completed: true 
    });
  }

  res.json(beat);
}));

router.post('/:worldId/events', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const { 
    arcId, 
    beatId, 
    eventType, 
    description, 
    impactLevel, 
    affectedRegions 
  } = req.body;

  if (!eventType || !description) {
    return res.status(400).json({ 
      error: 'Event type and description are required' 
    });
  }

  const event = await worldArcService.recordWorldEvent({
    world_id: worldId,
    arc_id: arcId,
    beat_id: beatId,
    event_type: eventType,
    description,
    impact_level: impactLevel || 'minor',
    affected_regions: affectedRegions
  });

  res.status(201).json(event);
}));

router.get('/:worldId/events', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const events = await supabaseService.getRecentEvents(worldId, limit);
  res.json(events);
}));

router.post('/:worldId/arcs/:arcId/complete', asyncHandler(async (req, res) => {
  const { worldId, arcId } = req.params;
  
  await worldArcService.completeArc(worldId, arcId);
  res.json({ 
    message: 'Arc completed successfully',
    arcId
  });
}));

// ---------------------------------------------------------------------------
// Nested routes (preferred new pattern) -------------------------------------
// These mirror the above endpoints but include the parent worldId in the URL
// so the REST hierarchy is clearer.  They simply delegate to the same logic
// after basic validation, ensuring backward-compatibility with existing
// clients while allowing newer clients to adopt the nested structure.
// ---------------------------------------------------------------------------

router.get('/:worldId/arcs/:arcId/beats', asyncHandler(async (req, res) => {
  const { worldId, arcId } = req.params;
  logger.logAPICall('GET', `/api/worlds/${worldId}/arcs/${arcId}/beats`);

  // Validate the arc belongs to the world to prevent cross-world leakage.
  const arc = await supabaseService.getArc(arcId);
  if (!arc || arc.world_id !== worldId) {
    return res.status(404).json({ error: 'Arc not found for this world' });
  }

  const beats = await supabaseService.getArcBeats(arcId);
  logger.success('Returned beats (nested)', { worldId, arcId, count: beats.length });
  res.json(beats);
}));

router.post('/:worldId/arcs/:arcId/progress', asyncHandler(async (req, res) => {
  const { worldId, arcId } = req.params;
  logger.logAPICall('POST', `/api/worlds/${worldId}/arcs/${arcId}/progress`, req.body);

  // Verify arc -> world relationship first
  const arc = await supabaseService.getArc(arcId);
  if (!arc || arc.world_id !== worldId) {
    return res.status(404).json({ error: 'Arc not found for this world' });
  }

  const { recentEvents } = req.body;

  const beat = await worldArcService.progressArc({
    worldId,
    arcId,
    recentEvents,
  });

  if (!beat) {
    return res.json({ message: 'Arc is complete', completed: true });
  }

  res.json(beat);
}));

export default router;