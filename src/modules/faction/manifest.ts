import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { factionRouter } from './delivery/trpc/router';
import { FactionService } from './application/FactionService';
import path from 'path';
import { dirnameFromMeta } from '../../core/infra/esmPath';
import { createLogger } from '../../core/infra/logger';

// Import DI bindings to ensure they're registered
import './infra';

// Import DI bindings from dependent modules to ensure they are registered *before* the FactionService is resolved.
// These side-effect imports guarantee that `WorldRepo`, `LocationRepo`, and other tokens are available in the
// tsyringe container, regardless of the module bootstrap order.
import '../world/infra';
import '../location/infra';

const logger = createLogger('faction.manifest');
const __dirname = dirnameFromMeta(import.meta.url);
logger.debug('[faction.manifest] resolved __dirname', { __dirname });

const FactionModule: EngineModule = {
  name: 'faction',
  migrations: [path.join(__dirname, 'backend', 'migrations')],
  register(app, di) {
    // Register the service - it will auto-register for events in constructor
    di.registerSingleton(FactionService);
    
    // Eagerly instantiate to start listening for events
    di.resolve(FactionService);
    
    // Mount REST routes via tRPC bridge
    mountTrpcAsRest(app, {
      router: factionRouter,
      basePath: '/api/factions',
      exposeMetaRoute: true
    });
  }
};

export default FactionModule;