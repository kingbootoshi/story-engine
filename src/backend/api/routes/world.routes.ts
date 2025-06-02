import { Router } from 'express';
import supabaseService from '../../services/supabase.service';
import worldArcService from '../../services/worldArc.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('world.routes');
const router = Router();

// Create a new world
router.post('/', async (req, res, next) => {
  logger.logAPICall('POST', '/api/worlds', req.body);
  
  try {
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const world = await supabaseService.createWorld(name, description);
    
    logger.logAPICall('POST', '/api/worlds', req.body, { status: 201, data: world });
    res.status(201).json(world);
  } catch (error) {
    next(error);
  }
});

// Get world details with current state
router.get('/:worldId', async (req, res, next) => {
  const { worldId } = req.params;
  logger.logAPICall('GET', `/api/worlds/${worldId}`);
  
  try {
    const worldState = await worldArcService.getWorldState(worldId);
    res.json(worldState);
  } catch (error) {
    next(error);
  }
});

// Create a new arc for a world
router.post('/:worldId/arcs', async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// Get all arcs for a world
router.get('/:worldId/arcs', async (req, res, next) => {
  try {
    const { worldId } = req.params;
    const arcs = await supabaseService.getWorldArcs(worldId);
    res.json(arcs);
  } catch (error) {
    next(error);
  }
});

// Get beats for a specific arc
router.get('/:worldId/arcs/:arcId/beats', async (req, res, next) => {
  try {
    const { arcId } = req.params;
    const beats = await supabaseService.getArcBeats(arcId);
    res.json(beats);
  } catch (error) {
    next(error);
  }
});

// Progress the current arc (generate next beat)
router.post('/:worldId/arcs/:arcId/progress', async (req, res, next) => {
  const { worldId, arcId } = req.params;
  logger.logAPICall('POST', `/api/worlds/${worldId}/arcs/${arcId}/progress`, req.body);
  
  try {
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
  } catch (error) {
    next(error);
  }
});

// Record a world event
router.post('/:worldId/events', async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// Get recent events for a world
router.get('/:worldId/events', async (req, res, next) => {
  try {
    const { worldId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const events = await supabaseService.getRecentEvents(worldId, limit);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Complete the current arc
router.post('/:worldId/arcs/:arcId/complete', async (req, res, next) => {
  try {
    const { worldId, arcId } = req.params;
    
    await worldArcService.completeArc(worldId, arcId);
    res.json({ 
      message: 'Arc completed successfully',
      arcId
    });
  } catch (error) {
    next(error);
  }
});

export default router;