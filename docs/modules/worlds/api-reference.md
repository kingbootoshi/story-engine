# World Module – Developer Interface

Everything below is **source-of-truth** for backend consumers (tRPC or plain HTTP) and for other Story-Engine modules that need to react to world-level events.

---

### 1 tRPC Procedures

| Proc Name          | Kind       | Purpose                                            |
| ------------------ | ---------- | -------------------------------------------------- |
| `list`             | `query`    | Fetch all worlds, newest first                     |
| `create`           | `mutation` | Create a new world (name, description)             |
| `get`              | `query`    | Fetch a single world by id                         |
| `createNewArc`     | `mutation` | Generate a fresh 15-beat arc with 3 anchors        |
| `progressArc`      | `mutation` | Produce the next dynamic beat (or finish the arc)  |
| `recordWorldEvent` | `mutation` | Log a player/system event back into the narrative  |
| `getWorldState`    | `query`    | Aggregate view: world + current arc + beats/events |
| `completeArc`      | `mutation` | Force-complete an arc and generate its summary     |

*All procedures live in `modules/world/delivery/trpc/router.ts` and carry Zod-validated input/output.*

---

### 2 Automatic REST Endpoints

`expressBridge` converts those procedures for REST consumers; the mapping is:

```
GET    /api/worlds                       → list
POST   /api/worlds                       → create
GET    /api/worlds/:worldId              → get world  (basic info)
GET    /api/worlds/:worldId/state        → getWorldState   (full snapshot)
POST   /api/worlds/:worldId/arcs         → createNewArc
POST   /api/worlds/arcs/:arcId/progress  → progressArc
POST   /api/worlds/:worldId/events       → recordWorldEvent
POST   /api/worlds/:worldId/arcs/:arcId/complete → completeArc
```

> **Tip**: Use the meta endpoint `GET /api/worlds/meta` during dev to view the live route list.

---

### 3 Domain Events Emitted

Other modules should subscribe via `eventBus.on(topic, handler)`; payload types are exported from `modules/world/domain/events.ts`.

| Topic                 | Fires when…                           |
| --------------------- | ------------------------------------- |
| `world.created`       | A world is inserted                   |
| `world.arc-created`   | `createNewArc` succeeds               |
| `world.beat-created`  | A dynamic beat or anchor is persisted |
| `world.arc-completed` | An arc status switches to `completed` |
| `world.event-logged`  | `recordWorldEvent` writes a new row   |

The payload always includes `worldId` plus contextual ids (e.g., `arcId`, `beatId`).

---

### 4 Input / Output Nuggets

* **World description** – plain Markdown permitted; no size limit, but prompts use the first 4 000 chars.
* **Event impact** – `'minor' | 'moderate' | 'major'`; the AI adapter weights these when constructing context.
* **Beat index** – integer 0 – 14; anchors occupy 0 / 7 / 14, everything else is `dynamic`.

Keep those contracts intact—breaking changes invalidate cached prompts and OpenPipe analytics.

---

### 5 Quick cURL Examples

```bash
# create a world
curl -X POST http://localhost:3001/api/worlds \
     -d '{"name":"Eldoria","description":"High-fantasy archipelago"}' \
     -H 'Content-Type: application/json'

# progress the current arc
curl -X POST http://localhost:3001/api/worlds/arcs/<arcId>/progress \
     -d '{"worldId":"<worldId>"}' \
     -H 'Content-Type: application/json'
```

---

### 6 Local Mock Strategy for Tests

When unit-testing **world** logic:

```ts
import { InMemoryWorldRepo } from 'tests/_shared/InMemoryWorldRepo';
import { makeFakeChat }     from 'tests/_shared/mockChat';

beforeEach(() => {
  container.reset();
  container.register('WorldRepo', { useClass: InMemoryWorldRepo });
  container.register('WorldAI',   { useValue: {
    generateAnchors: vi.fn().mockResolvedValue(fakeAnchors),
    generateBeat:    vi.fn().mockResolvedValue(fakeBeat),
    summarizeArc:    vi.fn().mockResolvedValue('dummy summary')
  }});
});
```

No Supabase, no network—just in-memory Maps and stubbed AI.

---

### 7 Future-proofing Checklist

* Add new world events? Document them here and in `event-conventions.mdc`.
* Change input shape? Update Zod schema **and** regenerate this cheat-sheet.
* Modify REST paths? Adjust the override map in `expressBridge` and bump the docs.

Document once, ship forever.
