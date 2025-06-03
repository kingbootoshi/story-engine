import { log } from '../../shared/utils/logger';
import * as worldRepo from './world.repo';

interface CreateWorldParams {
  name: string;
  description: string;
}

export async function createWorld(params: CreateWorldParams) {
  log.info('Creating world', { name: params.name });
  const world = await worldRepo.create({ name: params.name, description: params.description });
  return world;
} 