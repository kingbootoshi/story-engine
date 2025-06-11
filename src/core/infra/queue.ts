import PQueue from 'p-queue';

/**
 * Shared queue instance for background AI tasks.
 *
 * We expose a small wrapper that hides the underlying implementation so we can
 * swap it later (e.g. BullMQ or cloud task runner) without touching module
 * code.  Concurrency is capped at 3 by default to stay within vendor rate
 * limits, but individual services may create their own queues when they need
 * different throughput characteristics.
 */
export function createTaskQueue(concurrency = 3): PQueue {
  // Using `queueMicrotask` default implementation which is plenty for I/O-bound
  // work (network round-trips to the LLM) while still allowing CPU time to be
  // yielded back to Node's event loop between completions.
  return new PQueue({ concurrency });
}