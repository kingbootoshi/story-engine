import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import worldRoutes from './routes/world.routes';
import { createLogger } from '../utils/logger';

// Load environment variables
dotenv.config();

const logger = createLogger('server');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/worlds', worldRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      ai: !!process.env.OPENROUTER_API_KEY,
      database: !!process.env.SUPABASE_URL
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`API Error: ${req.method} ${req.path}`, err, {
    status: err.status || 500,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🌍 World Story Engine API running on port ${PORT}`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/api/health`);
  logger.info('Environment status', {
    hasSupabase: !!process.env.SUPABASE_URL,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasOpenPipe: !!process.env.OPENPIPE_API_KEY
  });
});

export default app;