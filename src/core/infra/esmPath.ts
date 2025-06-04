import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createLogger } from './logger';

const logger = createLogger('esmPath');

/**
 * Returns an absolute directory path derived from an ES-module meta URL.
 *
 * @param metaUrl - typically `import.meta.url`
 * @returns the directory name (equivalent of CommonJS `__dirname`)
 */
export function dirnameFromMeta(metaUrl: string): string {
  const filename = fileURLToPath(metaUrl);
  return path.dirname(filename);
}

// Log creation for traceability
logger.debug('[esmPath] dirnameFromMeta initialised');