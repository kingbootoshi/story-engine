// src/shared/utils/loggerBrowser.ts

// ---------------------------------------------------------------------------
// Browser-friendly logger shim (Winston replacement)
// ---------------------------------------------------------------------------
// We preserve the same public API shape used in Node but simply delegate to
// `console` so the front-end bundle stays light-weight and avoids Node polyfills.
// ---------------------------------------------------------------------------

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'http'

// Generic formatter – prepends timestamp + module name -----------------------
function format(module: string, level: LogLevel, message: string, meta?: unknown) {
  const ts = new Date().toISOString()
  // eslint-disable-next-line no-console
  console[level === 'http' ? 'info' : level](`${ts} [${level}] [${module}]: ${message}`, meta ?? '')
}

export function createLogger(module: string) {
  return {
    error: (msg: string, meta?: unknown) => format(module, 'error', msg, meta),
    warn: (msg: string, meta?: unknown) => format(module, 'warn', msg, meta),
    info: (msg: string, meta?: unknown) => format(module, 'info', msg, meta),
    debug: (msg: string, meta?: unknown) => format(module, 'debug', msg, meta),
    http: (msg: string, meta?: unknown) => format(module, 'http', msg, meta),
    success: (msg: string, meta: unknown = {}) => format(module, 'info', `✅ ${msg}`, meta),
    // Stubs for specialised helpers -----------------------------------------
    logAPICall(method: string, endpoint: string, data?: unknown, response?: unknown) {
      format(module, 'info', `API Call: ${method} ${endpoint}`, { request: data, response })
    },
    logAICall(operation: string, model: string, input: unknown, output?: unknown, error?: unknown) {
      if (error) {
        format(module, 'error', `AI Service Error: ${operation}`, { model, input, error })
      } else {
        format(module, 'info', `AI Service: ${operation}`, { model, inputLength: JSON.stringify(input).length, outputLength: output ? JSON.stringify(output).length : 0 })
      }
    },
    logDBOperation(operation: string, table: string, data: unknown = {}, result?: unknown, error?: unknown) {
      format(module, error ? 'error' : 'info', `DB ${operation} on ${table}`, { data, result, error })
    },
    logArcProgression(worldId: string, arcId: string, beatIndex: number, action: string, details?: Record<string, unknown>) {
      format(module, 'info', `Arc Progression: ${action}`, { worldId, arcId, beatIndex, ...details })
    },
  }
} 