import 'reflect-metadata';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from '../../core/bootstrap';
import { createLogger } from '../../core/infra/logger';

dotenv.config();

const logger = createLogger('server');
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const app = await createServer();
    
    app.use(cors());
    
    app.get('/api/health', (_req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
          ai: !!process.env.OPENROUTER_API_KEY,
          database: !!process.env.SUPABASE_URL
        }
      });
    });
    
    app.listen(PORT, () => {
      logger.info(`🌍 World Story Engine API running on port ${PORT}`);
      logger.info(`📝 API Documentation: http://localhost:${PORT}/api/health`);
      logger.info('Environment status', {
        hasSupabase: !!process.env.SUPABASE_URL,
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
        hasOpenPipe: !!process.env.OPENPIPE_API_KEY
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();