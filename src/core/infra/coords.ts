import Poisson from 'poisson-disk-sampling';

/**
 * Generates non-overlapping coordinates within a 0-100 square.
 *
 * We use Poisson-disk sampling to guarantee a minimum distance between points
 * so that markers don't clump visually on the map rendered by the client.
 *
 * The `minDistance` value of 8 was chosen empirically – it fits up to ~15
 * points comfortably while still providing enough spacing to distinguish
 * locations at a glance.
 *
 * @param count  Desired number of coordinates to return. If Poisson generates
 *               fewer than requested, we slice the array which preserves
 *               distribution quality for the given world size.
 * @returns      Array of coordinate pairs on the inclusive 0-100 grid.
 */
export function generateCoords(count: number): Array<{ x: number; y: number }> {
  // Poisson accepts the canvas shape in pixels; we treat each unit as a percent
  // point so a 100×100 grid becomes the sampling space.
  const sampler = new Poisson({ shape: [100, 100], minDistance: 8, tries: 30 });
  const points: Array<[number, number]> = sampler.fill();

  // `Poisson#fill` returns an array of tuples [x, y]. We coerce to objects for
  // easier downstream consumption and slice to the required count.
  return points.slice(0, count).map(([x, y]: [number, number]) => ({ x, y }));
}