# tRPC Integration Guide (Story-Engine)

*End-to-end type safety from database to UI—zero redundancy, zero `any` types.*

---

## 1 System Overview

Story-Engine uses **tRPC v11** as the primary API layer with an innovative **Express Bridge** that automatically exposes every tRPC procedure as both:

- **Native tRPC** endpoints at `/api/trpc/*` (for type-safe frontend calls)
- **REST** endpoints at `/api/<module>/*` (for external integrations, testing, mobile apps)

This dual-surface approach gives you:
- ✅ **Full TypeScript safety** between frontend ↔ backend
- ✅ **Zero type duplication** (frontend imports server types directly)
- ✅ **Automatic REST API** (no manual Express route writing)
- ✅ **Single source of truth** (Zod schemas drive everything)

---

## 2 Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   tRPC Client    │───▶│  AppRouter      │
│   React/Vue     │    │   (typed)        │    │  (aggregated)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐             ▼
│   External      │───▶│   REST Endpoints │    ┌─────────────────┐
│   Clients       │    │   (auto-gen)     │◀───│ Express Bridge  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Module Routers  │
                                                │ world, character│
                                                └─────────────────┘
```

### Key Components

1. **`AppRouter`** (`src/core/trpc/rootRouter.ts`)
   - Aggregates all module routers into a single type-safe tree
   - Exported type used by frontend for complete type inference

2. **Express Bridge** (`src/core/trpc/expressBridge.ts`)
   - Automatically converts tRPC procedures → REST endpoints
   - Handles path mapping, input/output transformation, error formatting

3. **Module Routers** (`src/modules/*/delivery/trpc/router.ts`)
   - Define domain-specific procedures (queries & mutations)
   - Use Zod schemas for input/output validation

---

## 3 Frontend Type Safety (Zero Redundancy)

### ❌ Wrong Way (Manual Types)
```ts
// DON'T DO THIS - creates duplication
interface World {
  id: string;
  name: string;
  // ... manually maintained
}
```

### ✅ Correct Way (Inferred Types)
```ts
// frontend/pages/WorldsList.tsx
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../core/trpc/rootRouter';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type World = RouterOutputs['world']['list'][number];  // ← Single source of truth
```

### Complete Frontend Setup

```ts
// frontend/trpcClient.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../core/trpc/rootRouter';
import superjson from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink<AppRouter>({
      url: '/api/trpc',
      transformer: superjson,
      headers: async () => ({
        Authorization: `Bearer ${await getAuthToken()}`,
      }),
    }),
  ],
});
```

### Making Type-Safe Calls

```ts
// All calls are fully typed with IntelliSense
const worlds = await trpc.world.list.query();           // GET
const world = await trpc.world.get.query(worldId);      // GET with param
const created = await trpc.world.create.mutate({        // POST
  name: 'New World',
  description: 'Epic fantasy realm'
});

// TypeScript catches errors at compile time:
// ❌ trpc.world.create.mutate({ invalid: 'field' });  // Error!
// ❌ trpc.nonExistent.procedure.query();              // Error!
```

---

## 4 Module Creation with tRPC

### Step 1: Define Zod Schemas (`domain/schema.ts`)

```ts
import { z } from 'zod';

export const Character = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'npc']),
  personality: z.array(z.string()),
  location_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});

export type Character = z.infer<typeof Character>;

// Input DTOs (omit auto-generated fields)
export const CreateCharacter = Character.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateCharacter = Character.partial().omit({
  id: true,
  created_at: true
});
```

### Step 2: Build Service Layer (`application/CharacterService.ts`)

```ts
import { injectable, inject } from 'tsyringe';
import type { CharacterRepo, CharacterAI } from '../domain/ports';
import type { Character, CreateCharacter } from '../domain/schema';

@injectable()
export class CharacterService {
  constructor(
    @inject('CharacterRepo') private repo: CharacterRepo,
    @inject('CharacterAI') private ai: CharacterAI,
    @inject('Logger') private logger: Logger
  ) {}

  async listCharacters(worldId: string): Promise<Character[]> {
    this.logger.info('Listing characters', { worldId });
    return this.repo.findByWorldId(worldId);
  }

  async createCharacter(input: CreateCharacter): Promise<Character> {
    this.logger.info('Creating character', { name: input.name });
    
    // Business logic here
    const character = await this.repo.create(input);
    
    // Emit domain event for other modules
    eventBus.emit('character.created', { character });
    
    return character;
  }

  async generateDialogue(characterId: string, context: string): Promise<string> {
    const character = await this.repo.findById(characterId);
    if (!character) throw new TRPCError({ code: 'NOT_FOUND' });
    
    return this.ai.generateDialogue({ character, context });
  }
}
```

### Step 3: Create tRPC Router (`delivery/trpc/router.ts`)

```ts
import { z } from 'zod';
import { container } from 'tsyringe';
import { router, publicProcedure, authedProcedure } from '../../../../core/trpc/init';
import { CharacterService } from '../../application/CharacterService';
import * as S from '../../domain/schema';

// Helper to resolve service (avoids repetition)
const characterService = () => container.resolve(CharacterService);

export const characterRouter = router({
  // GET /api/characters?worldId=xxx
  list: publicProcedure
    .input(z.object({ worldId: z.string().uuid() }))
    .output(S.Character.array())
    .query(async ({ input }) => {
      return characterService().listCharacters(input.worldId);
    }),

  // GET /api/characters/:id
  get: publicProcedure
    .input(z.string().uuid())
    .output(S.Character.nullable())
    .query(async ({ input }) => {
      return characterService().getCharacter(input);
    }),

  // POST /api/characters
  create: authedProcedure  // Requires authentication
    .input(S.CreateCharacter)
    .output(S.Character)
    .mutation(async ({ input, ctx }) => {
      // ctx.user available due to authedProcedure
      return characterService().createCharacter(input);
    }),

  // PUT /api/characters/:id
  update: authedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: S.UpdateCharacter
    }))
    .output(S.Character)
    .mutation(async ({ input }) => {
      return characterService().updateCharacter(input.id, input.data);
    }),

  // POST /api/characters/:id/dialogue
  generateDialogue: publicProcedure
    .input(z.object({
      characterId: z.string().uuid(),
      context: z.string().min(1)
    }))
    .output(z.object({ dialogue: z.string() }))
    .mutation(async ({ input }) => {
      const dialogue = await characterService().generateDialogue(
        input.characterId,
        input.context
      );
      return { dialogue };
    }),
});
```

### Step 4: Register in Root Router (`core/trpc/rootRouter.ts`)

```ts
import { router } from './init';
import { worldRouter } from '../../modules/world/delivery/trpc/router';
import { characterRouter } from '../../modules/character/delivery/trpc/router';

export const appRouter = router({
  world: worldRouter,
  character: characterRouter,  // ← Add your new router
  // location: locationRouter,  // ← Future modules
});

export type AppRouter = typeof appRouter;
```

### Step 5: Mount in Module Manifest (`manifest.ts`)

```ts
import { mountTrpcAsRest } from '../../core/trpc/expressBridge';
import { characterRouter } from './delivery/trpc/router';
import type { EngineModule } from '../../core/types';

const CharacterModule: EngineModule = {
  name: 'character',
  register(app, di) {
    // Register DI bindings
    di.registerSingleton(CharacterService);
    
    // Auto-mount REST endpoints
    mountTrpcAsRest(app, {
      router: characterRouter,
      basePath: '/api/characters',
      exposeMetaRoute: true  // Enables /api/characters/meta for API docs
    });
  },
  subscriptions: [
    {
      topic: 'world.arcCompleted',
      handler: async (event, di) => {
        const service = di.resolve(CharacterService);
        await service.handleArcCompletion(event.payload);
      }
    }
  ]
};

export default CharacterModule;
```

---

## 5 Express Bridge: tRPC → REST Mapping

The Express Bridge automatically creates RESTful endpoints from your tRPC procedures:

### Default Mapping Rules

| tRPC Pattern | HTTP Method | REST Path | Example |
|--------------|-------------|-----------|---------|
| `list`, `getAll` | `GET` | `/api/<module>` | `GET /api/characters` |
| `get`, `findById` | `GET` | `/api/<module>/:id` | `GET /api/characters/uuid` |
| `create`, `add` | `POST` | `/api/<module>` | `POST /api/characters` |
| `update`, `edit` | `PUT` | `/api/<module>/:id` | `PUT /api/characters/uuid` |
| `delete`, `remove` | `DELETE` | `/api/<module>/:id` | `DELETE /api/characters/uuid` |

### Custom Mappings (when needed)

```ts
// In expressBridge.ts, add to REST_MAPPINGS:
const REST_MAPPINGS: Record<string, Partial<RestMapping>> = {
  // Standard patterns (already defined)
  list: { method: 'GET', restPath: '' },
  create: { method: 'POST', restPath: '' },
  
  // Custom patterns for complex procedures
  generateDialogue: { 
    method: 'POST', 
    restPath: '/:characterId/dialogue' 
  },
  moveToLocation: { 
    method: 'PATCH', 
    restPath: '/:characterId/location' 
  },
};
```

### Request/Response Transformation

The bridge handles:
- **Input mapping**: URL params + query + body → tRPC input
- **Output formatting**: tRPC output → JSON response
- **Error handling**: tRPC errors → HTTP status codes
- **Content negotiation**: JSON only (API-first design)

---

## 6 Advanced Patterns

### Nested Resources

```ts
// tRPC procedure
moveCharacter: publicProcedure
  .input(z.object({
    characterId: z.string().uuid(),
    locationId: z.string().uuid(),
    reason: z.string().optional()
  }))
  .mutation(async ({ input }) => { /* ... */ }),

// Auto-generated REST
// POST /api/characters/:characterId/move
// Body: { "locationId": "uuid", "reason": "seeking shelter" }
```

### Batch Operations

```ts
// Frontend batching (automatic with httpBatchLink)
const [worlds, characters] = await Promise.all([
  trpc.world.list.query(),
  trpc.character.list.query({ worldId })
]);

// Single HTTP request to /api/trpc with batched queries
```

### Subscription-like Patterns (via Polling)

```ts
// Use tRPC's built-in query invalidation
const utils = trpc.useContext();

// After mutation, invalidate related queries
await trpc.character.create.mutate(data);
await utils.character.list.invalidate();  // Refetch list
```

---

## 7 Error Handling

### Backend (tRPC Errors)

```ts
import { TRPCError } from '@trpc/server';

if (!character) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Character not found',
    cause: new Error('Character lookup failed')
  });
}

if (!hasPermission) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Insufficient permissions',
  });
}
```

### Frontend (Error Handling)

```ts
try {
  const character = await trpc.character.get.query(id);
} catch (error) {
  if (error instanceof TRPCClientError) {
    switch (error.data?.code) {
      case 'NOT_FOUND':
        showNotification('Character not found');
        break;
      case 'UNAUTHORIZED':
        redirectToLogin();
        break;
      default:
        showErrorDialog(error.message);
    }
  }
}
```

### REST Error Format

```json
// GET /api/characters/invalid-id
// HTTP 404
{
  "error": "Character not found",
  "code": "NOT_FOUND",
  "data": {
    "httpStatus": 404,
    "path": "character.get"
  }
}
```

---

## 8 Development Workflow

### Adding a New Procedure

1. **Define in service** (business logic)
2. **Add to router** (I/O validation)
3. **Test manually** via Playground (`/playground`)
4. **Use in frontend** (types auto-update)

### Debugging

- **tRPC DevTools**: Install browser extension for query inspection
- **Network tab**: Check `/api/trpc` requests for batching
- **Playground**: Test procedures interactively at `/playground`
- **REST endpoints**: Use Postman/curl for external testing

### Performance

- **Batching**: Multiple queries → single HTTP request
- **Caching**: Use tRPC's built-in query caching
- **Compression**: gzip enabled on Express
- **Validation**: Zod schemas parsed once, cached

---

## 9 Migration from REST-only

### Before (Manual REST)
```ts
// ❌ Manual Express routes
app.get('/api/characters', async (req, res) => {
  // Manual validation, error handling, etc.
});

// ❌ Frontend types (duplicated)
interface Character { /* manual copy */ }
```

### After (tRPC)
```ts
// ✅ tRPC procedure (type-safe, auto-validated)
list: publicProcedure
  .input(QuerySchema)
  .output(Character.array())
  .query(({ input }) => service.list(input)),

// ✅ Frontend (inferred types)
type Character = RouterOutputs['character']['list'][number];
```

### Benefits

- **90% less boilerplate** (no manual Express routes)
- **Zero type drift** (frontend/backend always in sync)
- **Better DX** (IntelliSense, compile-time errors)
- **Automatic docs** (via `/meta` endpoints)

---

## 10 Best Practices

### ✅ Do

- Use Zod schemas for all inputs/outputs
- Keep procedures focused (single responsibility)
- Leverage `authedProcedure` for protected endpoints
- Emit domain events from services, not routers
- Use `inject()` DI pattern consistently
- Test via both tRPC client and REST endpoints

### ❌ Don't

- Define types manually in frontend
- Put business logic in routers (delegate to services)
- Use `any` types (defeats tRPC's purpose)
- Call other modules' services directly (use events)
- Skip input validation (Zod catches bugs early)
- Mix REST and tRPC for the same endpoint

---

## 11 Future Considerations

### Real-time (WebSockets/SSE)
```ts
// tRPC v11 subscriptions (planned)
characterUpdates: publicProcedure
  .subscription(() => {
    return observable<Character>((emit) => {
      eventBus.on('character.updated', emit.next);
    });
  }),
```

### Microservices
```ts
// Federation via tRPC routers
const federatedRouter = router({
  characters: proxy('http://character-service'),
  worlds: proxy('http://world-service'),
});
```

### Mobile Apps
```ts
// React Native with tRPC
import { httpBatchLink } from '@trpc/client';
// Same types, same calls, different transport
```

---

## Summary

Story-Engine's tRPC integration provides:
- **Type safety** without duplication
- **Dual API surface** (tRPC + REST)
- **Zero configuration** REST endpoints
- **Scalable module architecture**

Follow this guide and you'll have bulletproof APIs with minimal effort.
