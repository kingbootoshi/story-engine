# 🛰️ Story-Engine – Agent On-Ramp

Welcome, Claude. Thank you for joining us today!
You are about to modify code that powers dynamic self-evolving game-world narratives.

---

## 0 Mission-Critical Reading Order

1. **RULES** (mandatory – read every session BEFORE coding)  
   * `.cursor/rules/commenting-guidelines.mdc`  
   * `.cursor/rules/styling-guidelines.mdc`  
   * `.cursor/rules/logging-guidelines.mdc`  
   * `.cursor/rules/project-structure-guidelines.mdc`  
   * `.cursor/rules/tech-stack.mdc`  
   * `.cursor/rules/testing-guidelines.mdc` _(you generate tests)_  
   * `.cursor/rules/event-conventions.mdc` _(naming)_  
   * `.cursor/rules/error-handling-guidelines.mdc` _(if present)_

2. **CONTEXT DOCS** (read only what you touch)  
   * `docs/ai.md` – AI adapter + metadata contract  
   * `docs/creating_modules.md` – module authoring walkthrough when making new modules
   * `docs/modules/<domain>/*` – domain-specific narrative design & API cheatsheet  
   * `docs/modules/worlds/api-reference.md` – example of a complete module doc

3. **TECH SNAPSHOT**  
   * The codebase runs **Express + tRPC 11 + tsyringe DI**.  
   * DB = **Supabase Postgres**; unit tests _never_ hit the network.  
   * AI calls funnel through `src/core/ai/chat.ts` with mandatory `buildMetadata`.  
   * Event flow is in-process `EventEmitter`; swap to broker later without code changes.

---

## 1 Do & Don’t

✔️ **Do**

* Respect the vertical-slice module layout.  
* Emit logs with `createLogger()` and required meta (`correlation`, etc.).  
* Validate all IO with Zod.  
* Provide unit tests under `tests/` using **Vitest** and in-memory fakes.  
* Include prompt version (`prompt_id@vX`) when you add/change AI prompts.

❌ **Don’t**

* Call Supabase directly in tests.  
* Check in secrets or full AI prompt text.  
* Cross-import services between modules – use `eventBus`.

---

## 2 Fast Dev Commands

```bash
npm dev:all         # run API + Vite HMR
npm run scaffold X  # generate new module skeleton
npm vitest          # run offline unit tests
npm run lint-logs   # ensure log + metadata compliance
````

Essential env vars: `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

---

## 3 Quality Gate

CI refuses a PR if **any** of the following fail:

* ESLint, style, and log-lint.
* Type-check (`tsc --noEmit`).
* Vitest coverage < **85 %** lines for touched files.
* Schema ↔ SQL mismatch (`scripts/validate-schema.ts`).

Ship green or ship nothing.

---

> **Remember:** The rules folder is the contract.
> Re-read it whenever you alter logging, tests, prompts, or project structure.
> Everything else is implementation detail.

Good luck & enjoy building worlds.