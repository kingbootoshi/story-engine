/*
  Lightweight unit tests for `getCurrentBeat` – executed via `tsx` or any
  TypeScript runtime. Uses Node's built-in `assert` to avoid external deps.
*/

import assert from 'assert'
import { getCurrentBeat } from './beatHelpers'
import type { WorldBeat } from './api'

// Helper to fabricate beats quickly ------------------------------------------
function beat(index: number): WorldBeat {
  return {
    id: `beat-${index}`,
    beat_index: index,
    beat_name: `Beat ${index}`,
    description: '',
    world_directives: [],
    emergent_storylines: [],
    arc_id: 'arc-test',
    created_at: new Date().toISOString(),
  } as unknown as WorldBeat // Cast – we only need the tested fields here
}

// Test scenarios derived from spec ------------------------------------------
const scenarios: [number[], number | null][] = [
  [[], null],
  [[0], 0],
  [[0, 7, 14], 0],
  [[0, 1, 2], 2],
  [[0, 1, 2, 7], 2],
  [[...Array(15).keys()], 14],
]

for (const [indexes, expected] of scenarios) {
  const beats = indexes.map(beat)
  const current = getCurrentBeat(beats)
  assert.strictEqual(current?.beat_index ?? null, expected, `Current beat for [${indexes}] should be ${expected}`)
}

console.log('✔ beatHelpers – all tests passed') 