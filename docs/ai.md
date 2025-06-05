# AI-Integration Guide

*How to wire prompts, function-calling, and **mandatory metadata** for flawless observability.*

---

## 1 Why metadata matters

Every call to `chat()` is logged and optionally shipped to OpenPipe / tracing back-ends. Uniform keys let us:

* slice token spend per feature
* pinpoint slow prompts
* replay failures with full context

Missing or malformed metadata blocks all those dashboards—treat it as required API surface.

---

## 2 The helper you must use

```ts
import { chat, buildMetadata } from '../../core/ai';
```

`buildMetadata(module, promptId, extra?)` returns a plain object merged into the logger entry and forwarded to OpenPipe.

---

## 3 Mandatory keys for **every** AI call

When you call `buildMetadata`, supply at minimum:

```ts
{
  module:      'world',                     // folder name
  prompt_id:   'generate_dynamic_world_beat', // descriptive snake-case id
  correlation: ctx.reqId                    // request trace id
}
```

Anything less will throw a runtime error in CI.

---

### Additional required keys when available

Provide these if your context naturally contains them; otherwise omit.

* `world_id`
* `arc_id`
* `beat_index`
* `character_id` / `location_id` / `faction_id` (exact label depends on module)

Example inside `WorldService.progressArc`:

```ts
metadata: buildMetadata('world', 'generate_dynamic_world_beat', {
  correlation: ctx.reqId,
  world_id: params.worldId,
  arc_id:    params.arcId,
  beat_index: ctx.currentBeatIndex
})
```

---

## 4 Recommended but optional keys

Add freely; they cost nothing and pay dividends in dashboards.

* `user_id` or `api_key` if the call is user-triggered
* `stage`   – fully-qualified method name (`application.WorldService.progressArc`)
* `attempt` – retry counter
* `feature_flag` – name of any experimental flag active for the run

---

## 5 End-to-end pattern (copy-paste)

```ts
@injectable()
export class CharacterAIAdapter implements CharacterAI {
  private readonly MODEL = 'anthropic/claude-sonnet-4';
  private readonly MOD   = 'character';

  async generateDialogue(ctx: DialogueCtx, trace: TrpcCtx) {
    const completion = await chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserPrompt(ctx) }
      ],
      tools: [DIALOGUE_SCHEMA],
      tool_choice: { type:'function', function:{ name:'generate_dialogue' } },
      temperature: 0.8,
      metadata: buildMetadata(this.MOD, 'generate_dialogue', {
        correlation: trace.reqId,
        world_id:    ctx.worldId,
        character_id: ctx.id,
        stage: 'application.CharacterService.generateDialogue'
      })
    });

    return JSON.parse(
      completion.choices[0].message.tool_calls![0].function.arguments
    ).utterance;
  }
}
```

`chat()` will add latency and token usage; the logger will emit one line:

```
2025-06-04T20:12:01Z [info] [character]: AI call {prompt_id:"generate_dialogue", world_id:"...", ...}
```

OpenPipe receives the same payload for analytics.

---

## 6 Prompt and schema hygiene checklist

* **One prompt per `prompt_id`** – never re-use ids with different text.
* Store prompt builders under `infra/ai/prompts/`.
* Always prefer **function-calling** JSON; parse in adapter, never outside.
* Cap `max_tokens` sensibly; set `temperature` intentionally.

---

## 7 CI guardrails

`./scripts/validate-metadata.ts` runs in the pre-commit hook:

* checks for `module`, `prompt_id`, `correlation`
* blocks commit if required keys are absent

Keep your adapter copy-paste up to date and the hook stays green.