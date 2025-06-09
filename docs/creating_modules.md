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
   │  ├─ ai/              # AI adapter + prompts
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
   * `CharacterAIAdapter.ts` – wrap `chat()` with function-calling JSON.

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

```ts
@injectable()
export class CharacterAIAdapter implements CharacterAI {
  private readonly MODEL = 'openai/gpt-4.1-nano';
  private readonly MODULE = 'character';

  async generateDialogue(ctx: DialogueCtx) {
    const completion = await chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserPrompt(ctx) }
      ],
      tools: [DIALOGUE_SCHEMA],
      tool_choice: { type:'function', function:{ name:'generate_dialogue' } },
      temperature: 0.8,
      metadata: buildMetadata(this.MODULE, 'generate_dialogue', { character_id: ctx.id })
    });
    return JSON.parse(
      completion.choices[0].message.tool_calls![0].function.arguments
    ).utterance;
  }
}
```

Always return strict JSON; parse inside the adapter, never downstream.

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
* `manifest.ts` registers DI, mounts router, declares subscriptions—nothing more.

Follow this guide and every new module will integrate flawlessly with the Story-Engine core.