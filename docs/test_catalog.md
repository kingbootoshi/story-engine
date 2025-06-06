
---

## 2 `docs/test-catalog.md` — Current Test Suite Explained

# Story-Engine · Test Catalogue
_Last updated 2025-06-06_

This file maps every spec file in `tests/` to its purpose so newcomers
(👋 AI agents!) can see at a glance what's covered and where to add more.

### Core

**tests/core/logger.spec.ts** (tests `core/infra/logger.ts`)
- Logger factory creates distinct instances
- All log levels & helpers (`logAICall`, `logDBOperation`, `success`, etc) accept meta and never throw
- Error helpers work with both `Error` and plain objects

### Prompt Builders

**tests/world/prompts/anchorPrompt.spec.ts** (tests `ANCHOR_SYSTEM_PROMPT`, `buildAnchorUserPrompt()`)
- System prompt still instructs on real-player-action ethos & three anchor points
- User prompt injects world name/desc, story idea, history, and always requests exactly three anchors

**tests/world/prompts/dynamicBeatPrompt.spec.ts** (tests `DYNAMIC_BEAT_SYSTEM_PROMPT`, `buildDynamicBeatUserPrompt()`)
- System prompt keeps rules for systemic change and player agency
- User prompt carries current index, previous beats, next anchor, recent events (or placeholder text)

### WorldService – Create & Progress

**tests/world/WorldService.create.spec.ts** (tests `WorldService.createWorld()`)
- World persisted in repo
- `world.created` event emitted with correct payload
- Happy path & repo-failure path

**tests/world/WorldService.progressArc.spec.ts** (tests `WorldService.progressArc()`)
- Dynamic beat generation adds correct next index
- Uses provided recent events or falls back to repo events
- Emits `world.beatCreated` event
- Completes arc when 15 beats exist and calls `summarizeArc`
- Handles missing anchor & AI failure error paths
- Ensures sequential filling (no gaps)

### Shared Fakes & Helpers (not specs)

**tests/_shared/fakes/*.ts** - In-memory adapters that provide drop-in replacements for Supabase repo, event bus, etc.

**tests/_shared/helpers/*.ts** - Stubs like `makeFakeChat`, `createMockLogger` used across specs

### Setup

**tests/_shared/setup.ts** - Global test bootstrap that:
- Resets DI container each spec
- Mocks Supabase client & Winston transports
- Seeds required `process.env` variables

## Coverage Summary (as of 2025-06-06)

### Core logger
100% line coverage - all public paths hit

### Prompt builders  
95% line coverage - only minor branch misses

### WorldService
92% line coverage - happy paths + major error branches

### Express bridge
TODO - smoke test planned Sprint 24

---

## How to Extend This Catalogue

1. Add your spec under `tests/<module>/…`.
2. Append a description here with a **one-line** summary of *why the test exists*.
3. Keep the sections grouped by module so it remains browsable.

_That's it—now every contributor (human or AI) can see the safety net._
