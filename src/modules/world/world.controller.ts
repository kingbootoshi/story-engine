import type { Request, Response, NextFunction } from 'express';
import * as worldSvc from './world.service';
import { log } from '../../shared/utils/logger';

export const createWorld = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const world = await worldSvc.createWorld(req.body);
    (log as any).http('POST /api/worlds', { body: req.body, resultId: world.id });
    res.status(201).json(world);
  } catch (err) {
    next(err);
  }
}; 