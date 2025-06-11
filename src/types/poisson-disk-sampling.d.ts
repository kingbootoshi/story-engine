declare module 'poisson-disk-sampling' {
  interface PoissonOptions {
    shape: [number, number];
    minDistance?: number;
    maxDistance?: number;
    tries?: number;
  }

  export default class Poisson {
    constructor(options: PoissonOptions);
    fill(): Array<[number, number]>;
  }
}