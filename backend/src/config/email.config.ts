import { getRequiredEnv, getRequiredNumberEnv } from './env.loader.js';

export const emailConfig = {
  smtp: {
    host: getRequiredEnv('SMTP_HOST'),
    port: getRequiredNumberEnv('SMTP_PORT'),
    user: getRequiredEnv('SMTP_USER'),
    pass: getRequiredEnv('SMTP_PASS'),
    service: getRequiredEnv('SMTP_SERVICE'),
    secure: getRequiredNumberEnv('SMTP_PORT') === 465,
  },
  from: {
    email: getRequiredEnv('FROM_EMAIL'),
    name: getRequiredEnv('FROM_NAME'),
  },
} as const;
