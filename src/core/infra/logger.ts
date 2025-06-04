import winston from 'winston';
import path from 'path';
import fs from 'fs';

const LOG_DIR = 'logs';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
    let logMessage = `${timestamp} [${level}] [${module ?? 'unknown'}]: ${message}`;
    if (Object.keys(meta).length) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: baseFormat }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'all.log'),
    format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
  }),
];

export const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  transports,
});

class Logger {
  private child: winston.Logger;

  constructor(moduleName: string) {
    this.child = log.child({ module: path.basename(moduleName, path.extname(moduleName)) });
  }

  private log(level: keyof typeof levels, message: string, meta?: Record<string, unknown>) {
    this.child.log(level, message, meta ?? {});
  }

  error(message: string, error?: Error | unknown, meta: Record<string, unknown> = {}) {
    const errorMeta = error instanceof Error ? { error: { message: error.message, stack: error.stack, name: error.name }, ...meta } : { error, ...meta };
    this.log('error', message, errorMeta);
  }
  warn(message: string, meta?: Record<string, unknown>) { this.log('warn', message, meta); }
  info(message: string, meta?: Record<string, unknown>) { this.log('info', message, meta); }
  debug(message: string, meta?: Record<string, unknown>) { this.log('debug', message, meta); }
  http(message: string, meta?: Record<string, unknown>) { this.log('http', message, meta); }

  success(message: string, meta: Record<string, unknown> = {}) { this.info(`✅ ${message}`, { success: true, ...meta }); }

  logAPICall(method: string, endpoint: string, data?: unknown, response?: { status: number; data: unknown }) {
    this.info(`API Call: ${method} ${endpoint}`, { request: data, response });
  }

  logAICall(operation: string, model: string, input: unknown, output?: unknown, error?: unknown) {
    if (error) {
      this.error(`AI Service Error: ${operation}`, error, { model, input });
    } else {
      this.info(`AI Service: ${operation}`, { model, inputLength: JSON.stringify(input).length, outputLength: output ? JSON.stringify(output).length : 0 });
      this.debug(`AI Service Details: ${operation}`, { model, input, output });
    }
  }

  logDBOperation(operation: string, table: string, data: unknown = {}, result?: unknown, error?: unknown) {
    if (error) {
      this.error(`Database Error: ${operation} on ${table}`, error, { data });
    } else {
      this.info(`Database: ${operation} on ${table}`, { recordCount: Array.isArray(result) ? result.length : 1 });
      this.debug(`DB Details: ${operation} on ${table}`, { data, result });
    }
  }

  logArcProgression(worldId: string, arcId: string, beatIndex: number, action: string, details?: Record<string, unknown>) {
    this.info(`Arc Progression: ${action}`, { worldId, arcId, beatIndex, ...details });
  }
}

export function createLogger(module: string) {
  return new Logger(module);
}

export const logger = createLogger('core');