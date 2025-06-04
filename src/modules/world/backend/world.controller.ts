import type { Request, Response, NextFunction } from 'express';
import { DI } from '../../../core/infra/container';
import { createLogger } from '../../../core/infra/logger';
import WorldService from './world.service';

const logger = createLogger('world.controller');

export const createWorld = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const { name, description } = req.body;
    
    if (!name || !description) {
      res.status(400).json({ error: 'Name and description are required' });
      return;
    }
    
    const world = await worldService.createWorld(name, description);
    logger.http('POST /worlds', { body: req.body, resultId: world.id });
    res.status(201).json(world);
  } catch (err) {
    next(err);
  }
};

export const getWorld = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const world = await worldService.getWorldState(req.params.worldId);
    logger.http('GET /worlds/:worldId', { worldId: req.params.worldId });
    res.json(world);
  } catch (err) {
    next(err);
  }
};

export const listWorlds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const worlds = await worldService.listWorlds();
    logger.http('GET /worlds', { count: worlds.length });
    res.json(worlds);
  } catch (err) {
    next(err);
  }
};

export const createArc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const { worldId } = req.params;
    const { storyIdea } = req.body;
    
    const world = await worldService.getWorld(worldId);
    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }
    
    const result = await worldService.createNewArc({
      worldId,
      worldName: world.name,
      worldDescription: world.description,
      storyIdea
    });
    
    logger.http('POST /worlds/:worldId/arcs', { worldId, arcId: result.arc.id });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const progressArc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const { arcId } = req.params;
    const { worldId, recentEvents } = req.body;
    
    if (!worldId) {
      res.status(400).json({ error: 'worldId is required' });
      return;
    }
    
    const beat = await worldService.progressArc({
      worldId,
      arcId,
      recentEvents
    });
    
    logger.http('POST /arcs/:arcId/progress', { arcId, beatGenerated: !!beat });
    
    if (!beat) {
      res.json({ message: 'Arc is complete', beat: null });
    } else {
      res.json({ beat });
    }
  } catch (err) {
    next(err);
  }
};

export const recordEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const { worldId } = req.params;
    const eventData = {
      world_id: worldId,
      ...req.body
    };
    
    const event = await worldService.recordWorldEvent(eventData);
    logger.http('POST /worlds/:worldId/events', { worldId, eventId: event.id });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

export const completeArc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const worldService = DI.resolve(WorldService);
    const { worldId, arcId } = req.params;
    
    await worldService.completeArc(worldId, arcId);
    logger.http('POST /worlds/:worldId/arcs/:arcId/complete', { worldId, arcId });
    res.json({ message: 'Arc completed successfully' });
  } catch (err) {
    next(err);
  }
};