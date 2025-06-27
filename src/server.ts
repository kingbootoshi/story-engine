import { config } from 'dotenv';
// Load environment variables FIRST before any other imports
config();

import 'reflect-metadata';
import { createServer } from './core/bootstrap';
import { createLogger } from './core/infra/logger';

const logger = createLogger('server');
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    const app = await createServer();
    
    app.listen(PORT, () => {
      logger.info(`🛸 Story Engine API listening on port ${PORT}`);
      logger.info(`📝 Health check: http://localhost:${PORT}/api/health`);
      logger.info('Environment status', {
        hasSupabase: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
        hasOpenPipe: !!process.env.OPENPIPE_API_KEY
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
})();