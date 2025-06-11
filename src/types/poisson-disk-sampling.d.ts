declare module 'poisson-disk-sampling' {
  interface Options {
    shape: [number, number];
    minDistance?: number;
    maxDistance?: number;
    tries?: number;
    distanceFunction?: (point: number[], existingPoint: number[]) => number;
  }

  export default class PoissonDiskSampling {
    constructor(options: Options);
    next(): false | [number, number];
    addRandomPoint(): [number, number];
    addPoint(point: [number, number]): [number, number];
    removePoint(point: [number, number]): void;
    reset(): void;
    fill(): [number, number][];
    points: [number, number][];
    readonly grid: number[][][];
  }
}