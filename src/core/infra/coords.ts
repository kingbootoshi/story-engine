/*
 * Coordinate allocation helpers for world maps.
 *
 * Uses Poisson-disk sampling to guarantee a minimum distance between points
 * so that markers never visually overlap on a 0-100 normalised canvas.
 *
 * Exported helpers:
 *  • allocCoords(n, taken?, minDistance?) – generate N unique coordinates.
 *  • allocAround(parent, taken?, radius?) – place a child near its parent.
 *
 * NOTE: We use floating-point values with one decimal to reduce string size
 *       when stored as `relative_x` / `relative_y` columns.
 */

import PoissonDiskSampling from 'poisson-disk-sampling';
import { createLogger } from './logger';

export interface Coord {
  x: number; // 0-100
  y: number; // 0-100
}

const log = createLogger('core.coords');

function key({ x, y }: Coord): string {
  // one-decimal rounding is more than enough precision for a 100×100 canvas
  return `${x.toFixed(1)}|${y.toFixed(1)}`;
}

/**
 * Allocate `n` coordinates that keep at least `minDistance` units apart from
 * each other *and* from an optional list of already-taken positions.
 */
export function allocCoords(
  n: number,
  taken: Coord[] = [],
  minDistance = 6
): Coord[] {
  if (n <= 0) return [];

  // Build a quick lookup of occupied keys
  const occupied = new Set<string>(taken.map(key));

  // Poisson-disk sampler initialised over a 0-100 square
  const pds = new PoissonDiskSampling({
    shape: [100, 100],
    minDistance,
    tries: 30 // default 30 attempts per point before giving up
  });

  const points: Coord[] = [];

  // We attempt until we either have enough points or sampler exhausts.
  while (points.length < n) {
    const p = pds.next();

    if (p === false) {
      // Sampler exhausted – lower distance slightly and retry once.
      if (minDistance > 2) {
        log.warn('Sampler exhausted, lowering minDistance and retrying', {
          previous: minDistance
        });
        return allocCoords(n, [...taken, ...points], minDistance - 1);
      }
      throw new Error(
        `Unable to allocate ${n} coords – canvas saturated (${points.length} generated before exhaustion).`
      );
    }

    const [x, y] = p;
    const c: Coord = { x: round1(x), y: round1(y) };
    const k = key(c);
    if (occupied.has(k)) continue; // collision with existing point

    occupied.add(k);
    points.push(c);
  }

  return points;
}

/**
 * Allocate a coordinate within `radius` of a parent. We walk concentric rings
 * (Manhattan distance) until we find an available slot. This is cheaper than
 * Poisson sampling a sub-square and still ensures siblings avoid overlaps.
 */
export function allocAround(
  parent: Coord,
  taken: Coord[] = [],
  radius = 15
): Coord {
  const occupied = new Set<string>(taken.map(key));

  // candidate offsets at 1-unit granularity inside the radius circle
  const candidates: Coord[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const distSq = dx * dx + dy * dy;
      if (distSq === 0 || distSq > radius * radius) continue;
      const x = clamp(parent.x + dx, 0, 100);
      const y = clamp(parent.y + dy, 0, 100);
      candidates.push({ x: round1(x), y: round1(y) });
    }
  }

  shuffle(candidates);

  for (const c of candidates) {
    if (!occupied.has(key(c))) {
      return c;
    }
  }

  // Fallback: greedily pick a random coordinate
  log.warn('allocAround fell back to global allocator');
  return allocCoords(1, taken)[0];
}

/* -------------------------------------------------------------------------- */
// Utility helpers
/* -------------------------------------------------------------------------- */

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function round1(num: number): number {
  return Math.round(num * 10) / 10;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}