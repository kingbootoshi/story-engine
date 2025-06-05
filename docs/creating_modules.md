# Story-Engine Module Authoring Guide

*Create a new API module in minutes—no rewrites later.*

---

## 1 Foundational Principles

* **Vertical slice** – keep *domain → application → infra → delivery → manifest* in a single folder.
* **Ports first** – define interfaces (`*Repo`, `*AI`) before coding adapters.
* **Zod everywhere** – a single schema file drives DB rows, DTOs, and tRPC I/O.
* **tRPC rules** – expose procedures; the Express bridge automatically produces REST.
* **Events over imports** – cross-module chatter is `eventBus.emit()` / `eventBus.on()`.
* **One registration point** – all container bindings live in `infra/index.ts`.

---

## 2 Reference Layout (mirrored by every module)

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
```

Duplicate this structure for *character*, *location*, *faction*, etc.

---

## 3 End-to-End Workflow

1. **Scaffold**

   ```bash
   cp -R modules/world modules/character
   rm -rf modules/character/{beats,ai/prompts/*}
   ```

2. **Model the domain** (`domain/schema.ts`)

   ```ts
   export const Character = z.object({
     id: z.string().uuid(),
     world_id: z.string().uuid(),
     name: z.string(),
     role: z.string(),
     location_id: z.string().uuid().nullable(),
     personality: z.array(z.string()),
     created_at: z.string().datetime()
   });
   export type Character = z.infer<typeof Character>;
   export const CreateCharacter = Character.omit({ id:true, created_at:true });
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

## 4 tRPC ⇆ REST Mapping Cheat Sheet

*No extra work necessary.*
`publicProcedure.query()` ➜ `GET /api/<module>/<proc>`
`publicProcedure.mutation()` ➜
  *no path params* → `POST /api/<module>`
  *`:id` param*   → `PUT|DELETE /api/<module>/:id`
Override specifics in `expressBridge` map only when the default is insufficient.

---

## 5 Event Bus Usage

emit:

```ts
eventBus.emit<CharacterMoved>('character.moved', { characterId, to: loc });
```

listen:

```ts
eventBus.on<CharacterMoved>('character.moved', handler);
```

The current backend is an in-process `EventEmitter`; swapping to Redis/NATS later requires **zero module changes**.

---

## 6 AI Adapter Pattern

```ts
@injectable()
export class CharacterAIAdapter implements CharacterAI {
  private readonly MODEL = 'anthropic/claude-sonnet-4';
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

## 7 Quality Checklist Before Commit

* All entities & DTOs validated by Zod.
* No direct Supabase calls outside `*Repo`.
* No Express logic outside the router bridge.
* All cross-module coordination via `eventBus`; no service imports.
* `manifest.ts` registers DI, mounts router, declares subscriptions—nothing more.

Follow this guide and every new module will integrate flawlessly with the Story-Engine core.