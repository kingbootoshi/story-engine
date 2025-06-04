# Backend Developer Guide

## Folder Structure

```
src/backend/
├── api/
│   ├── routes/          # Express route definitions
│   │   └── world.routes.ts
│   └── server.ts        # Express app setup and middleware
├── services/            # Business logic layer
│   ├── ai.service.ts    # AI generation logic
│   ├── supabase.service.ts  # Database operations
│   └── worldArc.service.ts  # Core narrative logic
└── index.ts            # Entry point with env loading

src/ai/                 # AI-specific code (shared structure)
├── client/
│   └── openai.client.ts # OpenRouter client wrapper
├── prompts/            # Prompt templates
│   ├── anchor.prompts.ts
│   ├── arcSummary.prompts.ts
│   └── dynamicBeat.prompts.ts
└── schemas/            # AI response schemas
    └── worldArc.schema.ts

src/shared/             # Shared with frontend
├── config/
│   └── env.ts          # Environment validation
├── types/              # TypeScript interfaces
│   ├── arc.types.ts
│   ├── auth.types.ts
│   ├── beat.types.ts
│   └── world.types.ts
└── utils/
    ├── logger.ts       # Winston logger
    └── supabase.ts     # Shared DB client
```

## Core Concepts

### Services Architecture
The backend uses a layered architecture:
1. **Routes** - HTTP request handling and validation
2. **Services** - Business logic and orchestration
3. **Repositories** - Data access (via Supabase service)

### Key Services

#### AI Service (`ai.service.ts`)
Handles all AI generation with structured outputs:
```typescript
// Generate story anchors
await aiService.generateWorldArcAnchors(
  worldName,
  worldDescription,
  storyIdea?,
  previousArcs?
)

// Generate dynamic beats
await aiService.generateDynamicWorldBeat(
  worldName,
  currentBeatIndex,
  previousBeats,
  nextAnchor,
  recentEvents
)
```

#### World Arc Service (`worldArc.service.ts`)
Orchestrates the narrative system:
```typescript
// Create new story arc with 3 anchor points
await worldArcService.createNewArc({
  worldId,
  worldName,
  worldDescription,
  storyIdea?
})

// Progress story based on events
await worldArcService.progressArc({
  worldId,
  arcId,
  recentEvents?
})
```

#### Supabase Service (`supabase.service.ts`)
Provides typed database operations:
```typescript
// CRUD operations for all entities
await supabaseService.createWorld(name, description)
await supabaseService.createArc(worldId, storyName, storyIdea)
await supabaseService.createBeat(arcId, beatIndex, beatType, beatData)
await supabaseService.createEvent(eventData)
```

## Adding New Features

### 1. Adding a New API Endpoint

```typescript
// In world.routes.ts or create a new route file
router.post('/:worldId/custom-action', asyncHandler(async (req, res) => {
  const { worldId } = req.params
  const { customData } = req.body
  
  // Validation
  if (!customData) {
    return res.status(400).json({ error: 'Custom data required' })
  }
  
  // Call service layer
  const result = await worldArcService.performCustomAction(worldId, customData)
  
  res.json(result)
}))
```

### 2. Adding a New Service Method

```typescript
// In worldArc.service.ts or create new service
async performCustomAction(worldId: string, data: any) {
  // 1. Validate and fetch required data
  const world = await supabaseService.getWorld(worldId)
  if (!world) throw new Error('World not found')
  
  // 2. Perform business logic
  const processedData = this.processCustomData(data)
  
  // 3. Call AI if needed
  const aiResult = await aiService.generateCustomContent(processedData)
  
  // 4. Save to database
  const saved = await supabaseService.saveCustomData(aiResult)
  
  // 5. Log the operation
  logger.info('Custom action completed', { worldId, resultId: saved.id })
  
  return saved
}
```

### 3. Adding a New AI Generation Type

```typescript
// 1. Create prompt in src/ai/prompts/custom.prompts.ts
export const CUSTOM_SYSTEM_PROMPT = `You are an AI that generates...`

export function buildCustomUserPrompt(params: CustomParams): string {
  return `Generate content based on: ${params.input}`
}

// 2. Define schema for structured output
const CUSTOM_SCHEMA = {
  type: "function",
  function: {
    name: "generate_custom_content",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        metadata: { type: "object" }
      },
      required: ["content", "metadata"]
    }
  }
}

// 3. Add method to ai.service.ts
async generateCustomContent(params: CustomParams) {
  const completion = await openai.chat.completions.create({
    model: "anthropic/claude-sonnet-4",
    messages: [
      { role: "system", content: CUSTOM_SYSTEM_PROMPT },
      { role: "user", content: buildCustomUserPrompt(params) }
    ],
    tools: [CUSTOM_SCHEMA],
    tool_choice: { type: "function", function: { name: "generate_custom_content" } }
  })
  
  return JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments)
}
```

### 4. Adding Database Operations

```typescript
// In supabase.service.ts
async createCustomEntity(data: CustomEntity): Promise<CustomEntity> {
  const { data: result, error } = await supabase
    .from('custom_entities')
    .insert(data)
    .select()
    .single()
    
  if (error) throw error
  return result
}

// Don't forget to create the table in Supabase!
```

## Best Practices

### Error Handling
Always use the asyncHandler wrapper for routes:
```typescript
router.get('/path', asyncHandler(async (req, res) => {
  // Errors thrown here are caught automatically
}))
```

### Logging
Use the structured logger for debugging:
```typescript
logger.info('Operation started', { worldId, userId })
logger.error('Operation failed', error, { context })
logger.logAPICall('POST', '/api/worlds', requestData, response)
logger.logAICall('generateAnchors', model, input, output)
```

### Type Safety
Define interfaces for all data structures:
```typescript
interface CustomActionParams {
  worldId: string
  actionType: 'battle' | 'discovery' | 'alliance'
  participants: string[]
  impact: 'minor' | 'major'
}
```

### Database Queries
Use typed queries with proper error handling:
```typescript
try {
  const { data, error } = await supabase
    .from('worlds')
    .select('*, world_arcs(*)')
    .eq('id', worldId)
    .single()
    
  if (error) throw error
  return data
} catch (error) {
  logger.error('Failed to fetch world', error)
  throw new Error('Database operation failed')
}
```

## Testing

### Manual Testing
1. Use the debug logger: `npm run server:debug`
2. Check logs in `logs/` directory
3. Use Postman or curl for API testing
4. Monitor Supabase dashboard for DB queries

### Adding Tests
```typescript
// Create test files like world.service.test.ts
import { describe, it, expect } from 'vitest'
import { worldArcService } from './worldArc.service'

describe('WorldArcService', () => {
  it('should create arc with 3 anchors', async () => {
    const result = await worldArcService.createNewArc({...})
    expect(result.anchors).toHaveLength(3)
  })
})
```

## Common Patterns

### Singleton Services
Services use singleton pattern for shared state:
```typescript
class MyService {
  private static instance: MyService
  
  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService()
    }
    return MyService.instance
  }
}
```

### Configuration
Access environment variables through validated config:
```typescript
import { env } from '../../shared/config/env'
// env.OPENROUTER_API_KEY is typed and validated
```

### Async Operations
Always use async/await for clarity:
```typescript
// Good
const world = await supabaseService.getWorld(id)

// Avoid
supabaseService.getWorld(id).then(world => {...})
``` 