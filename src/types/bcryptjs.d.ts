/**
 * Minimal type declarations for `bcryptjs` used within the project.
 * These replicate only the async promise-based API surface actually consumed
 * by the codebase (hash, compare, genSalt). When `@types/bcryptjs` is
 * installed, TypeScript will prefer the full declarations from DefinitelyTyped.
 */
declare module 'bcryptjs' {
  // Hashes a plain string using either a salt string or a salt rounds count.
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;

  // Compares a plain string against a previously hashed one.
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;

  // Generates a salt string with the given cost factor.
  export function genSalt(rounds?: number): Promise<string>;
} 