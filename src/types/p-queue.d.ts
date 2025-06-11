declare module 'p-queue' {
  export interface QueueAddOptions {
    priority?: number;
    signal?: AbortSignal;
  }

  export interface PQueueOptions {
    concurrency?: number;
    autoStart?: boolean;
  }

  export default class PQueue {
    constructor(options?: PQueueOptions);
    add<T>(fn: () => Promise<T>, options?: QueueAddOptions): Promise<T>;
    addAll<T>(fns: Array<() => Promise<T>>, options?: QueueAddOptions): Promise<T[]>;
    onEmpty(): Promise<void>;
    onIdle(): Promise<void>;
    readonly size: number;
    readonly pending: number;
    clear(): void;
  }
}