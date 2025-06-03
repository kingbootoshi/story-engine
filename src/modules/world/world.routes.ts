import { Router } from 'express';
import { createWorld } from './world.controller';

const router = Router();

router.post('/', createWorld);

export default router; 