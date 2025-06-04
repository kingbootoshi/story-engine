// src/frontend/lib/beatHelpers.ts

// ---------------------------------------------------------------------------
// Helper utilities for World Beats
// ---------------------------------------------------------------------------

import type { WorldBeat } from './api'

/**
 * Determine the "current" beat given an array of beats.
 *
 * A beat is considered current when its `beat_index` is **the highest index in a
 * contiguous sequence starting at `0`**.
 *
 * In other words, we sort the beats and walk them until we hit the first gap in
 * the numerical sequence. The last beat *before* the gap (or the last beat in
 * the list if there is no gap) is returned.
 *
 * Examples:
 *   [0]                 → 0  (returns beat 0)
 *   [0, 7, 14]          → 0  (gap after 0)
 *   [0, 1, 2]           → 2
 *   [0, 1, 2, 7]        → 2  (gap after 2)
 *   [0 … 14]            → 14 (arc complete)
 *
 * @param beats - *Unsorted* array fetched from the API.
 * @returns The current WorldBeat or `null` when the array is empty.
 */
export function getCurrentBeat(beats: WorldBeat[]): WorldBeat | null {
  // Fast-path: no beats stored yet
  if (beats.length === 0) return null

  // Work on a copy so we never mutate React state objects --------------------
  const ordered = [...beats].sort((a, b) => a.beat_index - b.beat_index)

  /** The `beat_index` we expect to encounter next while walking the list */
  let expectedIndex = 0
  /** The beat that satisfies the contiguous requirement so far */
  let current: WorldBeat | null = null

  for (const beat of ordered) {
    if (beat.beat_index !== expectedIndex) {
      // Gap detected – we found the first missing index → stop traversing
      break
    }

    current = beat
    expectedIndex += 1 // Expect the next contiguous index
  }

  return current
} 