# Story-Engine Module Authoring Guide

*Create a new API module in minutes—no rewrites later.*

---

## 1 Foundational Principles

* **Vertical slice** – keep *domain → application → infra → delivery → manifest* in a single folder.
* **Ports first** – define interfaces (`*Repo`, `*AI`) before coding adapters.
* **Zod everywhere** – a single schema file drives DB rows, DTOs, and tRPC I/O.
* **tRPC rules** – expose procedures; the Express bridge automatically produces REST.
* **Events over imports** – cross-module chatter is `eventBus.emit()` / `eventBus.on()`.
* **One registration point** – all container bindings live in `infra/index.ts`.

---

## 2 Reference Layout (mirrored by every module)

```
modules/
└─ world/                 # exemplar
   ├─ domain/
   │  ├─ schema.ts        # entities + DTOs (Zod)
   │  ├─ ports.ts         # Repo & AI interfaces
   │  └─ events.ts        # typed domain events
   ├─ application/
   │  └─ WorldService.ts  # orchestration logic
   ├─ infra/
   │  ├─ persistence/     # Supabase repo
   │  ├─ ai/              # AI adapter + organized schemas
   │  │  ├─ schemas.ts    # Zod validation schemas
   │  │  ├─ toolSchemas.ts # OpenAI function-calling schemas
   │  │  ├─ types.ts      # TypeScript types from schemas
   │  │  ├─ MyModuleAIAdapter.ts # Main AI adapter
   │  │  └─ prompts/      # System/user prompt builders
   │  └─ index.ts         # DI registrations
   ├─ delivery/
   │  └─ trpc/router.ts   # procedures only
   └─ manifest.ts         # EngineModule definition
   └─ index.ts            # Entry point for module exports
```

Duplicate this structure for *character*, *location*, *faction*, etc.

---

## 3 End-to-End Workflow

1. **Scaffold**

   ```bash
   cp -R modules/world modules/character
   rm -rf modules/character/{beats,ai/prompts/*}
   ```

2. **Model the domain** (`domain/schema.ts`)

   **IMPORTANT: Use shared validation helpers for consistency and compatibility.**

   ```ts
   import { z } from 'zod';
   import { ISODateString, UUIDString, NonEmptyString } from '../../../shared/utils/validation';

   export const Character = z.object({
     id: UUIDString,
     world_id: UUIDString,
     name: NonEmptyString,
     role: z.string(),
     location_id: UUIDString.nullable(),
     personality: z.array(z.string()),
     created_at: ISODateString,
     updated_at: ISODateString.optional()
   });
   export type Character = z.infer<typeof Character>;
   export const CreateCharacter = Character.omit({ 
     id: true, 
     created_at: true, 
     updated_at: true 
   });
   ```

   **Why use `ISODateString` instead of `z.string().datetime()`?**
   
   Zod's built-in `datetime()` validator uses a strict RFC-3339 regex that **rejects** the 
   `+00` timezone format (without `:00`) that Postgres/Supabase commonly emits. This causes 
   "Output validation failed" errors when tRPC procedures return database entities.
   
   Our `ISODateString` accepts all real-world ISO formats while maintaining type safety:
   ```ts
   // ✅ All of these pass validation:
   "2025-06-06T12:38:07.387093+00"  // Postgres default
   "2025-06-06T12:38:07.387Z"       // ISO standard  
   "2025-06-06T12:38:07+00:00"      // RFC-3339 compliant
   
   // ❌ Invalid dates still fail:
   "not-a-date"                     // Error: Invalid ISO date string
   ```

3. **Declare ports** (`domain/ports.ts`)

   ```ts
   export interface CharacterRepo { /* CRUD signatures */ }
   export interface CharacterAI   { generateDialogue(ctx: DialogueCtx): Promise<string>; }
   ```

4. **Implement application logic** (`application/CharacterService.ts`)

   ```ts
   @injectable()
   export class CharacterService {
     constructor(
       @inject('CharacterRepo') private repo: CharacterRepo,
       @inject('CharacterAI')   private ai: CharacterAI
     ) {}
     async create(input: CreateCharacter) { return this.repo.create(input); }
     async move(id: string, locationId: string) { /* ... */ }
   }
   ```

5. **Wire infra adapters**

   * `SupabaseCharacterRepo.ts` – mirror `SupabaseWorldRepo` style.
   * **AI Adapter Structure** – organize AI code cleanly:
     ```bash
     mkdir -p infra/ai/prompts
     touch infra/ai/{schemas.ts,toolSchemas.ts,types.ts,CharacterAIAdapter.ts}
     ```
     Follow the AI Adapter Pattern in Section 6 for proper organization.

6. **Register the bindings** (`infra/index.ts`)

   ```ts
   container.register('CharacterRepo', { useClass: SupabaseCharacterRepo });
   container.register('CharacterAI',   { useClass: CharacterAIAdapter   });
   ```

7. **Expose API** (`delivery/trpc/router.ts`)

   ```ts
   export const characterRouter = router({
     list:   publicProcedure.output(S.Character.array())
             .query(() => svc().list()),
     create: publicProcedure.input(S.CreateCharacter).output(S.Character)
             .mutation(({input}) => svc().create(input))
   });
   function svc() { return container.resolve(CharacterService); }
   ```

8. **Publish the module** (`manifest.ts`)

   ```ts
   import './infra';            // DI side-effects
   const CharacterModule: EngineModule = {
     name: 'character',
     register(app, di) {
       di.registerSingleton(CharacterService);
       mountTrpcAsRest(app, {
         router: characterRouter,
         basePath: '/api/characters'
       });
     },
     subscriptions: [
       {
         topic: 'world.beatCreated',
         handler: async (evt, di) =>
           di.resolve(CharacterService).rememberBeat(evt.payload)
       }
     ]
   };
   export default CharacterModule;
   ```

9. **Add SQL migration** (`supabase/migrations/…sql`) for the new table.

10. **Smoke test**

    ```ts
    const res = await supertest(app).post('/api/characters').send({...});
    expect(res.status).toBe(201);
    ```

If these ten steps pass, the module is production-ready.

---

## 4 tRPC ⇆ REST Mapping Cheat Sheet

**See [tRPC Integration Guide](./TRPC.md) for complete details.**

Quick reference:
- `list` procedures → `GET /api/<module>`
- `get` procedures → `GET /api/<module>/:id`  
- `create` procedures → `POST /api/<module>`
- `update` procedures → `PUT /api/<module>/:id`
- Custom procedures → defined in `expressBridge` mappings

The Express Bridge automatically creates RESTful endpoints—no manual routing needed.

---

## 5 Event Bus Usage & The Golden Rule

### Core Events (Required Reading)

The Story Engine follows the **Golden Rule**: Every action → Event → Beat → Reactions → More Events

All modules must understand two fundamental events:

#### 1. Listening for Story Beats

```ts
// In your manifest.ts or service constructor
import type { StoryBeatCreated } from '../world/domain/events';

eventBus.on<StoryBeatCreated>('world.beat.created', (event) => {
  const { worldId, beatId, directives, emergent } = event.payload;
  
  // React to world directives
  directives.forEach(directive => {
    if (directive.includes('your-module-keyword')) {
      // Take appropriate action
    }
  });
  
  // Consider emergent storylines
  emergent.forEach(storyline => {
    // Spawn new content, adjust behaviors, etc.
  });
});
```

#### 2. Emitting World Events

When your module does something significant, emit a `world.event.logged`:

```ts
import type { WorldEventLogged } from '../world/domain/events';
import { randomUUID } from 'crypto';

// After any meaningful action
eventBus.emit<WorldEventLogged>('world.event.logged', {
  v: 1,
  worldId: affectedWorldId,
  eventId: randomUUID(),
  impact: 'moderate', // minor | moderate | major | catastrophic
  description: 'The merchant guild established a new trade route'
});
```

**Impact Level Guidelines:**
- `minor`: Routine activities, individual NPC actions
- `moderate`: Local changes, small group activities  
- `major`: Region-affecting events, significant plot developments
- `catastrophic`: World-shaking events, major character deaths

### Module-Specific Events

Your module can still emit its own events for internal use:

```ts
eventBus.emit<CharacterMoved>('character.moved', { characterId, to: loc });
```

And listen to other modules' events:

```ts
eventBus.on<FactionDisbanded>('faction.disbanded', handler);
```

### Event Safety

The event bus automatically:
- Tracks event hops (max 8 to prevent infinite loops)
- Enforces size limits (50KB max payload)
- Adds debug logging for all emissions

The current backend is an in-process `EventEmitter`; swapping to Redis/NATS later requires **zero module changes**.

---

## 6 AI Adapter Pattern

### Structure Your AI Code

All AI-related code should be organized within the `infra/ai/` directory using this structure:

```
infra/ai/
├─ schemas.ts        # Zod validation schemas for AI responses
├─ toolSchemas.ts    # OpenAI function-calling JSON schemas  
├─ types.ts          # TypeScript types derived from Zod schemas
├─ MyModuleAIAdapter.ts # Main adapter implementation
└─ prompts/          # System and user prompt builders
   ├─ myFunction.prompts.ts
   └─ anotherFunction.prompts.ts
```

### 1. Define Zod Schemas (`schemas.ts`)

**Separate validation schemas from adapter logic for reusability and clarity:**

```ts
import { z } from 'zod';

export const CharacterDialogueSchema = z.object({
  utterance: z.string(),
  emotion: z.enum(['happy', 'sad', 'angry', 'neutral']),
  confidence: z.number().min(0).max(1)
});

export const CharacterActionSchema = z.object({
  action: z.string(),
  target: z.string().nullable(),
  reasoning: z.string()
});
```

### 2. Define Tool Schemas (`toolSchemas.ts`)

**OpenAI function-calling requires separate JSON schemas (not Zod objects):**

```ts
export const GENERATE_DIALOGUE_SCHEMA = {
  type: 'function',
  function: {
    name: 'generate_dialogue',
    description: 'Generate character dialogue with emotional context',
    parameters: {
      type: 'object',
      properties: {
        utterance: { type: 'string' },
        emotion: { type: 'string', enum: ['happy', 'sad', 'angry', 'neutral'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['utterance', 'emotion', 'confidence'],
      additionalProperties: false
    },
    strict: true
  }
} as const;
```

### 3. Create Types (`types.ts`)

**Derive TypeScript types from your Zod schemas:**

```ts
import type { z } from 'zod';
import type { CharacterDialogueSchema, CharacterActionSchema } from './schemas';

export type CharacterDialogueData = z.infer<typeof CharacterDialogueSchema>;
export type CharacterActionData = z.infer<typeof CharacterActionSchema>;
```

### 4. Build the Adapter (`CharacterAIAdapter.ts`)

**Import your organized schemas and focus on business logic:**

```ts
import { injectable } from 'tsyringe';
import { 
  chat, 
  buildMetadata, 
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  AIValidationError 
} from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { CharacterAI, DialogueContext } from '../../domain/ports';
import { CharacterDialogueSchema } from './schemas';
import { GENERATE_DIALOGUE_SCHEMA } from './toolSchemas';
import { DIALOGUE_SYSTEM_PROMPT, buildDialogueUserPrompt } from './prompts/dialogue.prompts';

const logger = createLogger('character.ai');

@injectable()
export class CharacterAIAdapter implements CharacterAI {
  private readonly MODULE = 'character';

  async generateDialogue(ctx: DialogueContext): Promise<string> {
    const promptId = 'generate_dialogue@v1';
    const contextData = { characterId: ctx.character.id };

    logger.info('Generating character dialogue', contextData);

    try {
      const completion = await retryWithBackoff(
        () => chat({
          messages: [
            { role: 'system', content: DIALOGUE_SYSTEM_PROMPT },
            { role: 'user', content: buildDialogueUserPrompt(ctx) }
          ],
          tools: [GENERATE_DIALOGUE_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'generate_dialogue' } },
          temperature: 0.8,
          metadata: buildMetadata(this.MODULE, promptId, ctx.userId || 'anonymous', {
            character_id: ctx.character.id
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(completion, 'generate_dialogue', contextData);
      const parsedData = safeParseJSON(toolCall.function.arguments, contextData);

      // Validate with your Zod schema
      const validationResult = CharacterDialogueSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(validationResult.error, parsedData, contextData);
      }

      logger.info('Dialogue generated successfully', contextData);
      return validationResult.data.utterance;

    } catch (error) {
      logger.error('Failed to generate dialogue', {
        error: error instanceof Error ? error.message : String(error),
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }
}
```

### 5. Organize Prompts (`prompts/dialogue.prompts.ts`)

**Keep prompts separate and focused:**

```ts
import type { DialogueContext } from '../../../domain/ports';

export const DIALOGUE_SYSTEM_PROMPT = `You are a creative dialogue generator for interactive characters in a story world.

Generate natural, contextually appropriate dialogue that:
1. Matches the character's personality and background
2. Responds appropriately to the current situation
3. Advances the narrative or reveals character depth
4. Maintains consistency with established relationships`;

export function buildDialogueUserPrompt(ctx: DialogueContext): string {
  return `Character: ${ctx.character.name} (${ctx.character.role})
Personality: ${ctx.character.personality.join(', ')}
Current Situation: ${ctx.situation}
Speaking To: ${ctx.target || 'themselves'}
Context: ${ctx.context}

Generate appropriate dialogue for this character in this situation.`;
}
```

### Key Benefits of This Structure

✅ **Separation of Concerns** - Schemas, types, and business logic are cleanly separated  
✅ **Reusability** - Schemas and types can be imported by tests, other services, etc.  
✅ **Maintainability** - Easy to update validation rules without touching adapter logic  
✅ **Type Safety** - Proper TypeScript types derived from your validation schemas  
✅ **Testability** - Individual components can be unit tested in isolation  
✅ **Consistency** - All modules follow the same clean architecture pattern

### AI Adapter Best Practices

- **Always validate AI responses** with Zod schemas before returning data
- **Use retryWithBackoff** for resilience against transient AI failures  
- **Include contextData** in all logging and error handling
- **Set appropriate temperature** based on creativity needs (0.7-0.9 for creative, 0.3-0.5 for factual)
- **Use buildMetadata** for observability and AI cost tracking
- **Handle errors gracefully** with meaningful error messages for debugging

Always return validated, typed data from adapters—never raw AI responses.

---

## 7 Frontend Type Safety

**Never define types manually in the frontend.** Always derive them from the backend `AppRouter`.

### ✅ Correct Pattern
```ts
// frontend/pages/CharacterList.tsx
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '../../core/trpc/rootRouter';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;
type Character = RouterOutputs['character']['list'][number];
type CreateCharacterInput = RouterInputs['character']['create'];
```

### ❌ Wrong Pattern
```ts
// DON'T DO THIS - creates duplication
interface Character {
  id: string;
  name: string;
  // ... manually maintained
}
```

### Making Type-Safe Calls
```ts
// All calls are fully typed with IntelliSense
const characters = await trpc.character.list.query({ worldId });
const character = await trpc.character.create.mutate({
  name: 'Aragorn',
  role: 'protagonist',
  world_id: worldId
});

// TypeScript catches errors at compile time
// ❌ trpc.character.create.mutate({ invalid: 'field' });  // Compiler error!
```

For complete frontend integration details, see [tRPC Integration Guide](./TRPC.md).

---

## 8 Shared Validation Utilities Reference

Always import validation helpers from `src/shared/utils/validation.ts`:

| Validator | Use Case | Example |
|-----------|----------|---------|
| `ISODateString` | Database timestamps | `created_at: ISODateString` |
| `UUIDString` | Entity IDs, foreign keys | `id: UUIDString` |
| `NonEmptyString` | Required text fields | `name: NonEmptyString` |
| `PositiveInt` | Counts, indexes, limits | `beat_index: PositiveInt` |
| `OptionalNullableString` | Optional DB text fields | `summary: OptionalNullableString` |

**Why centralized validation?**
- **Consistency** across all modules (same error messages, same edge case handling)
- **Compatibility** with real-world database formats (especially timestamps)
- **Maintainability** – fix validation logic once, applies everywhere
- **Type safety** – prevents "Output validation failed" tRPC errors

---

## 9 Quality Checklist Before Commit

* All entities & DTOs validated by Zod using **shared validation utilities**.
* Database timestamps use `ISODateString`, UUIDs use `UUIDString`.
* No direct Supabase calls outside `*Repo`.
* No Express logic outside the router bridge.
* All cross-module coordination via `eventBus`; no service imports.
* **AI code properly structured**: schemas.ts, toolSchemas.ts, types.ts separated from adapter logic.
* **AI responses validated** with Zod schemas before returning data.
* All AI calls use `buildMetadata` for observability and include proper error handling.
* `manifest.ts` registers DI, mounts router, declares subscriptions—nothing more.

Follow this guide and every new module will integrate flawlessly with the Story-Engine core.