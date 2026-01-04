import path from 'path';
import { getRequiredNumberEnv } from './env.loader.js';

export const storageConfig = {
  local: {
    uploadDir: path.join(process.cwd(), 'public', 'uploads'),
    maxFileSize: getRequiredNumberEnv('MAX_FILE_SIZE'),
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ] as const,
    allowedExtensions: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'pdf',
      'doc',
      'docx',
    ] as const,
  },

  folders: {
    images: 'images',
    documents: 'documents',
    videos: 'videos',
    temp: 'temp',
  },
} as const;
