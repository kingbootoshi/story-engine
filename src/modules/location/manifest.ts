import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { locationRouter } from './delivery/trpc/router';
import { LocationService } from './application/LocationService';
import path from 'path';
import { dirnameFromMeta } from '../../core/infra/esmPath';
import { createLogger } from '../../core/infra/logger';

/**
 * Import DI bindings to ensure they're registered
 */
import './infra';

const logger = createLogger('location.manifest');
const __dirname = dirnameFromMeta(import.meta.url);
logger.debug('[location.manifest] resolved __dirname', { __dirname });

/**
 * Location module definition
 */
const LocationModule: EngineModule = {
  name: 'location',
  migrations: [path.join(__dirname, '..', '..', '..', 'supabase', 'migrations')],
  register(app, di) {
    /**
     * Register and eagerly instantiate LocationService to start event listeners
     */
    di.registerSingleton(LocationService);
    di.resolve(LocationService);
    logger.info('LocationService instantiated and listening for events');
    
    /**
     * Mount REST routes via tRPC bridge
     */
    mountTrpcAsRest(app, {
      router: locationRouter,
      basePath: '/api/locations',
      exposeMetaRoute: true
    });
    
    logger.info('Location module registered successfully');
  }
};

export default LocationModule;