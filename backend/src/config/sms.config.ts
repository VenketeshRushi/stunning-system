import { getRequiredEnv } from './env.loader.js';

export const smsConfig = {
  twilio: {
    accountSid: getRequiredEnv('TWILIO_ACCOUNT_SID'),
    authToken: getRequiredEnv('TWILIO_AUTH_TOKEN'),
    phoneNumber: getRequiredEnv('TWILIO_PHONE_NUMBER'),
  },
} as const;
