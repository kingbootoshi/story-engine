import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { worldRouter } from './delivery/trpc/router';
import { WorldService } from './application/WorldService';
import path from 'path';
import { dirnameFromMeta } from '../../core/infra/esmPath';
import { createLogger } from '../../core/infra/logger';

// Import DI bindings to ensure they're registered
import './infra';

const logger = createLogger('world.manifest');
const __dirname = dirnameFromMeta(import.meta.url);
logger.debug('[world.manifest] resolved __dirname', { __dirname });

const WorldModule: EngineModule = {
  name: 'world',
  migrations: [path.join(__dirname, 'backend', 'migrations')],
  register(app, di) {
    // Register the service
    di.registerSingleton(WorldService);
    
    // Mount REST routes via tRPC bridge
    mountTrpcAsRest(app, {
      router: worldRouter,
      basePath: '/api/worlds',
      exposeMetaRoute: true
    });
  },
  subscriptions: [
    {
      topic: 'character.died',
      handler: async (event, di) => {
        const worldService = di.resolve(WorldService);
        const { characterId, worldId } = event.payload;
        await worldService.handleCharacterDeath(characterId, worldId);
      }
    }
  ]
};

export default WorldModule;