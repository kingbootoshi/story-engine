import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, module, ...args } = info;
      const ts = timestamp.slice(0, 19).replace('T', ' ');
      
      let logMessage = `${timestamp} [${level}] [${module || 'unknown'}]: ${message}`;
      
      // Add additional data if present
      if (Object.keys(args).length > 0) {
        logMessage += '\n' + JSON.stringify(args, null, 2);
      }
      
      return logMessage;
    }
  ),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format,
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
  }),
];

// Create the logger
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
});

// Create a wrapper class for module-specific logging
export class Logger {
  private module: string;
  private logger: winston.Logger;

  constructor(module: string) {
    this.module = module;
    this.logger = baseLogger;
  }

  private log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, { module: this.module, ...meta });
  }

  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = error instanceof Error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...meta
    } : { error, ...meta };
    
    this.log('error', message, errorMeta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  success(message: string, meta?: any) {
    // Log success as info level with a success flag
    this.log('info', `✅ ${message}`, { success: true, ...meta });
  }

  http(message: string, meta?: any) {
    this.log('http', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  // Log API calls with detailed information
  logAPICall(method: string, endpoint: string, data?: any, response?: any) {
    this.info(`API Call: ${method} ${endpoint}`, {
      request: data,
      response: response ? {
        status: response.status,
        data: response.data
      } : undefined
    });
  }

  // Log AI service calls
  logAICall(operation: string, model: string, input: any, output?: any, error?: any) {
    if (error) {
      this.error(`AI Service Error: ${operation}`, error, {
        model,
        input,
        operation
      });
    } else {
      this.info(`AI Service: ${operation}`, {
        model,
        inputLength: JSON.stringify(input).length,
        outputLength: output ? JSON.stringify(output).length : 0,
        operation
      });
      
      this.debug(`AI Service Details: ${operation}`, {
        model,
        input,
        output
      });
    }
  }

  // Log database operations
  logDBOperation(operation: string, table: string, data?: any, result?: any, error?: any) {
    if (error) {
      this.error(`Database Error: ${operation} on ${table}`, error, {
        operation,
        table,
        data
      });
    } else {
      this.info(`Database: ${operation} on ${table}`, {
        operation,
        table,
        recordCount: Array.isArray(result) ? result.length : 1,
        success: true
      });
      
      this.debug(`Database Details: ${operation} on ${table}`, {
        data,
        result
      });
    }
  }

  // Log world arc progression
  logArcProgression(worldId: string, arcId: string, beatIndex: number, action: string, details?: any) {
    this.info(`Arc Progression: ${action}`, {
      worldId,
      arcId,
      beatIndex,
      action,
      ...details
    });
  }
}

// Factory function to create logger instances
export function createLogger(module: string): Logger {
  // Extract just the filename if it's a full path
  const moduleName = path.basename(module, path.extname(module));
  return new Logger(moduleName);
}

// Create directories for logs if they don't exist
import fs from 'fs';
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export default createLogger;