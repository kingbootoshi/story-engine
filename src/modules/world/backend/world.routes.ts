import { Router } from 'express';
import * as controller from './world.controller';

const router = Router();

router.get('/', controller.listWorlds);
router.post('/', controller.createWorld);
router.get('/:worldId', controller.getWorld);
router.post('/:worldId/arcs', controller.createArc);
router.post('/:worldId/events', controller.recordEvent);
router.post('/:worldId/arcs/:arcId/complete', controller.completeArc);

router.post('/arcs/:arcId/progress', controller.progressArc);

export default router; 