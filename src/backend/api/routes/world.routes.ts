import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import supabaseService from '../../services/supabase.service';
import worldArcService from '../../services/worldArc.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('world.routes');
const router = Router();

// ---------------------------------------------------------------------------
// Helper:  Wrap an async route handler so that returned promises are properly
// routed to `next()` for Express error handling _and_ align with the
// `RequestHandler` type signature (which expects a *non*-Promise return type).
// ---------------------------------------------------------------------------
function asyncHandler<T = any>(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<T>,
) {
  /*
   * We deliberately return a standard (non-async) function here.  This keeps the
   * type compatible with Express' `RequestHandler`, while still allowing the
   * wrapped function to use `await` internally.  Any rejected promise is
   * forwarded to `next()` so that our central error middleware can handle it.
   */
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Create a new world
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

// Get world details with current state
router.get('/:worldId', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  logger.logAPICall('GET', `/api/worlds/${worldId}`);
  
  const worldState = await worldArcService.getWorldState(worldId);
  res.json(worldState);
}));

// Create a new arc for a world
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

// Get all arcs for a world
router.get('/:worldId/arcs', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const arcs = await supabaseService.getWorldArcs(worldId);
  res.json(arcs);
}));

// Get beats for a specific arc
router.get('/:worldId/arcs/:arcId/beats', asyncHandler(async (req, res) => {
  const { arcId } = req.params;
  const beats = await supabaseService.getArcBeats(arcId);
  res.json(beats);
}));

// Progress the current arc (generate next beat)
router.post('/:worldId/arcs/:arcId/progress', asyncHandler(async (req, res) => {
  const { worldId, arcId } = req.params;
  logger.logAPICall('POST', `/api/worlds/${worldId}/arcs/${arcId}/progress`, req.body);
  
  const { recentEvents } = req.body;

  const beat = await worldArcService.progressArc({
    worldId,
    arcId,
    recentEvents
  });

  if (!beat) {
    return res.json({ 
      message: 'Arc is complete', 
      completed: true 
    });
  }

  res.json(beat);
}));

// Record a world event
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

// Get recent events for a world
router.get('/:worldId/events', asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const events = await supabaseService.getRecentEvents(worldId, limit);
  res.json(events);
}));

// Complete the current arc
router.post('/:worldId/arcs/:arcId/complete', asyncHandler(async (req, res) => {
  const { worldId, arcId } = req.params;
  
  await worldArcService.completeArc(worldId, arcId);
  res.json({ 
    message: 'Arc completed successfully',
    arcId
  });
}));

export default router;