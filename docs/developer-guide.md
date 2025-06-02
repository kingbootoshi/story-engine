# Developer Guide

This guide provides everything developers need to work with and extend the World Story Engine.

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- PostgreSQL (via Supabase)
- Git

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/world-story-engine.git
cd world-story-engine
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenPipe Configuration (optional but recommended)
OPENPIPE_API_KEY=your_openpipe_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3001
SITE_URL=http://localhost:5173

# Logging Configuration
LOG_LEVEL=debug # Options: error, warn, info, http, debug
DEBUG=true # Enable debug logging
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the schema SQL from `supabase/schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to `.env`

### 5. AI Service Setup

1. Create an account at [OpenRouter](https://openrouter.ai)
2. Generate an API key
3. (Optional) Set up OpenPipe for observability at [openpipe.ai](https://openpipe.ai)

## Running the Application

### Development Mode
```bash
npm run dev:all        # Run both frontend and backend
npm run dev:debug      # Run with debug logging enabled
```

### Production Build
```bash
npm run build          # Build frontend
npm run server         # Run backend server
```

### Individual Services
```bash
npm run dev            # Frontend only (Vite)
npm run server         # Backend only
npm run server:debug   # Backend with debug logging
```

## Project Structure

```
world-story-engine/
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── server.ts         # Express server setup
│   │   │   └── routes/           # API route handlers
│   │   ├── services/
│   │   │   ├── ai.service.ts     # AI integration with function calling
│   │   │   ├── supabase.service.ts # Database operations
│   │   │   └── worldArc.service.ts # Core narrative logic
│   │   ├── utils/
│   │   │   └── logger.ts         # Winston logger configuration
│   │   └── index.ts              # Backend entry point
│   ├── frontend/
│   │   ├── api.ts                # Frontend API client
│   │   └── app.ts                # Main frontend application
│   ├── main.ts                   # Frontend entry point
│   └── style.css                 # Application styles
├── docs/                         # Documentation
├── supabase/
│   └── schema.sql                # Database schema
├── logs/                         # Log files (git ignored)
└── package.json                  # Project configuration
```

## Core Services

### AI Service (`ai.service.ts`)

Handles all AI narrative generation using OpenAI function calling for guaranteed structured output.

```typescript
// Example: Generate world arc anchors
const anchors = await aiService.generateWorldArcAnchors(
  worldName,
  worldDescription,
  storyIdea,
  previousArcs
);
```

**Key Features:**
- Function calling with strict schemas
- Automatic retry logic
- Token usage tracking
- Comprehensive logging

### Supabase Service (`supabase.service.ts`)

Manages all database operations with built-in logging.

```typescript
// Example: Create a new world
const world = await supabaseService.createWorld(name, description);

// Example: Record an event
const event = await supabaseService.createEvent({
  world_id: worldId,
  event_type: 'player_action',
  description: 'Players discovered ancient ruins',
  impact_level: 'major'
});
```

### World Arc Service (`worldArc.service.ts`)

Orchestrates the narrative generation process.

```typescript
// Example: Progress the story
const nextBeat = await worldArcService.progressArc({
  worldId,
  arcId,
  recentEvents: 'Players formed alliance with dragons'
});
```

## API Endpoints

### Worlds

- `POST /api/worlds` - Create a new world
- `GET /api/worlds/:worldId` - Get world state
- `GET /api/worlds/:worldId/events` - Get recent events

### Arcs

- `POST /api/worlds/:worldId/arcs` - Create new arc
- `GET /api/worlds/:worldId/arcs` - List all arcs
- `GET /api/worlds/:worldId/arcs/:arcId/beats` - Get arc beats
- `POST /api/worlds/:worldId/arcs/:arcId/progress` - Generate next beat
- `POST /api/worlds/:worldId/arcs/:arcId/complete` - Complete arc

### Events

- `POST /api/worlds/:worldId/events` - Record world event

## Logging System

The application uses Winston for comprehensive logging:

### Log Levels
- `error`: System errors and failures
- `warn`: Warning conditions
- `info`: General information and success messages
- `http`: HTTP request logging
- `debug`: Detailed debugging information

### Using the Logger

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('my-module');

// Basic logging
logger.info('Operation started', { userId: 123 });
logger.error('Operation failed', error, { context: data });

// Specialized logging
logger.logAICall('generateContent', 'gpt-4', input, output);
logger.logDBOperation('INSERT', 'worlds', data, result);
logger.logAPICall('POST', '/api/worlds', reqBody, response);
```

### Log Files
- `logs/error.log` - Error-level logs only
- `logs/all.log` - All logs in JSON format
- Console output - Colored, formatted logs

## Function Calling Schemas

The AI service uses strict JSON schemas to ensure consistent output:

```typescript
const WORLD_ARC_ANCHORS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_world_arc_anchors",
    parameters: {
      type: "object",
      properties: {
        anchors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              beatIndex: { type: "number", enum: [0, 7, 14] },
              beatName: { type: "string" },
              // ... other properties
            },
            required: ["beatIndex", "beatName", ...],
            additionalProperties: false
          }
        }
      }
    },
    strict: true
  }
};
```

## Error Handling

All services implement comprehensive error handling:

```typescript
try {
  const result = await riskyOperation();
  logger.info('Operation succeeded', { result });
} catch (error) {
  logger.error('Operation failed', error, { context });
  throw new ApiError('User-friendly message', 500);
}
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Database Migrations

When modifying the database schema:

1. Update `supabase/schema.sql`
2. Create a migration file in `supabase/migrations/`
3. Test locally before applying to production

## Performance Optimization

### Caching
- AI responses cached for 15 minutes
- Database queries use connection pooling
- Static assets served with CDN headers

### Rate Limiting
- API endpoints limited to 100 requests/minute
- AI generation limited to 10 requests/minute
- Configurable per-endpoint limits

## Security Considerations

1. **API Keys**: Never commit API keys; use environment variables
2. **Input Validation**: All user input validated and sanitized
3. **SQL Injection**: Parameterized queries via Supabase
4. **CORS**: Configured for specific origins
5. **Authentication**: JWT tokens for API access (implement as needed)

## Debugging Tips

### Enable Debug Logging
```bash
DEBUG=true npm run server
```

### Common Issues

1. **"supabaseUrl is required"**
   - Ensure `.env` file exists and is properly configured
   - Check that environment variables are loaded before service initialization

2. **AI Generation Failures**
   - Verify OpenRouter API key is valid
   - Check API rate limits
   - Review logs for detailed error messages

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review Supabase dashboard for issues

### Using the Debug Tools

1. **Log Analysis**
   ```bash
   # View recent errors
   tail -f logs/error.log | jq '.'
   
   # Search for specific operations
   grep "generateWorldArcAnchors" logs/all.log | jq '.'
   ```

2. **API Testing**
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Create world with logging
   curl -X POST http://localhost:3001/api/worlds \
     -H "Content-Type: application/json" \
     -d '{"name": "Test World", "description": "A test world"}'
   ```

## Deployment

### Docker Support
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "server"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use secure API keys
- Configure proper CORS origins
- Set appropriate log levels

## Monitoring

### Recommended Services
- **Logs**: Datadog, LogRocket, or Sentry
- **APM**: New Relic or DataDog APM
- **Uptime**: Pingdom or UptimeRobot
- **Analytics**: OpenPipe dashboard for AI usage