import fs from 'fs';
import path from 'path';
import { config } from '../../config/index.js';
import { logger } from '../../services/logger/index.js';

export const ensureUploadDirs = (): void => {
  Object.values(config.storage.folders).forEach(folder => {
    const dir = path.join(config.storage.local.uploadDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`[Storage] Created upload directory: ${dir}`);
    }
  });
};

// Call on startup
ensureUploadDirs();
