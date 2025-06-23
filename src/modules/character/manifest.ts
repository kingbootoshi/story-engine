import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { characterRouter } from './delivery/trpc/router';
import { CharacterService } from './application/CharacterService';
import path from 'path';
import { dirnameFromMeta } from '../../core/infra/esmPath';
import { createLogger } from '../../core/infra/logger';

import './infra';

import '../world/infra';
import '../faction/infra';
import '../location/infra';

const logger = createLogger('character.manifest');
const __dirname = dirnameFromMeta(import.meta.url);
logger.debug('[character.manifest] resolved __dirname', { __dirname });

const CharacterModule: EngineModule = {
  name: 'character',
  migrations: [path.join(__dirname, 'backend', 'migrations')],
  register(app, di) {
    di.registerSingleton(CharacterService);
    
    di.resolve(CharacterService);
    
    mountTrpcAsRest(app, {
      router: characterRouter,
      basePath: '/api/characters',
      exposeMetaRoute: true
    });
  }
};

export default CharacterModule;