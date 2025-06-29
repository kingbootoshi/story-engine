import { ZodError } from 'zod';

export class AIError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {},
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AIError';
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

export class AIParsingError extends AIError {
  constructor(
    public readonly rawResponse: string,
    context: Record<string, unknown> = {},
    cause?: unknown
  ) {
    super('Failed to parse AI response', { ...context, rawResponse }, cause);
    this.name = 'AIParsingError';
    Object.setPrototypeOf(this, AIParsingError.prototype);
  }
}

export class AIValidationError extends AIError {
  constructor(
    public readonly zodError: ZodError,
    public readonly rawData: unknown,
    context: Record<string, unknown> = {}
  ) {
    const issues = zodError.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    super(`AI response validation failed: ${issues}`, { ...context, rawData, zodIssues: zodError.issues }, zodError);
    this.name = 'AIValidationError';
    Object.setPrototypeOf(this, AIValidationError.prototype);
  }
}

export class AIResponseError extends AIError {
  constructor(
    message: string,
    public readonly response: unknown,
    context: Record<string, unknown> = {}
  ) {
    super(message, { ...context, response });
    this.name = 'AIResponseError';
    Object.setPrototypeOf(this, AIResponseError.prototype);
  }
}

export class AIRetryableError extends AIError {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
    context: Record<string, unknown> = {},
    cause?: unknown
  ) {
    super(message, context, cause);
    this.name = 'AIRetryableError';
    Object.setPrototypeOf(this, AIRetryableError.prototype);
  }
}