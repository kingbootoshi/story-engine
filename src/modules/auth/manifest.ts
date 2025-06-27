import type { EngineModule } from '../../core/types';
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { authRouter } from './delivery/trpc/router';
import { ApiKeyService } from './application/ApiKeyService';
import { createLogger } from '../../core/infra/logger';

import './infra';

const logger = createLogger('auth.manifest');

const AuthModule: EngineModule = {
  name: 'auth',
  register(app, di) {
    di.registerSingleton(ApiKeyService);
    
    mountTrpcAsRest(app, {
      router: authRouter,
      basePath: '/api/auth',
      exposeMetaRoute: true
    });
    
    logger.info('Auth module registered with API key support');
  }
};

export default AuthModule;