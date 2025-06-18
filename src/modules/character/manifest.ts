import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { characterRouter } from './delivery/trpc/router';
import { CharacterService } from './application/CharacterService';
import path from 'path';
import { dirnameFromMeta } from '../../core/infra/esmPath';
import { createLogger } from '../../core/infra/logger';

// Import DI bindings to ensure they're registered
import './infra';

// Import DI bindings from dependent modules to ensure they are registered *before* the CharacterService is resolved.
// These side-effect imports guarantee that `WorldRepo`, `IFactionRepository`, `LocationRepository` and other tokens 
// are available in the tsyringe container, regardless of the module bootstrap order.
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
    // Register the service - it will auto-register for events in constructor
    di.registerSingleton(CharacterService);
    
    // Eagerly instantiate to start listening for events
    di.resolve(CharacterService);
    
    // Mount REST routes via tRPC bridge
    mountTrpcAsRest(app, {
      router: characterRouter,
      basePath: '/api/characters',
      exposeMetaRoute: true
    });
  }
};

export default CharacterModule;