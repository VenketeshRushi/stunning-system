import { getRequiredEnv } from './env.loader.js';
import { LLMProvider } from '../services/llm/llm.types.js';

export const llmConfig = {
  defaultProvider: LLMProvider.GOOGLE,

  providers: {
    [LLMProvider.OPENAI]: {
      apiKey: getRequiredEnv('OPENAI_API_KEY'),
      defaultModel: 'gpt-4o-mini',
    },

    [LLMProvider.GOOGLE]: {
      apiKey: getRequiredEnv('GOOGLE_API_KEY'),
      defaultModel: 'gemini-2.0-flash',
    },
  },

  defaults: {
    temperature: 0.1,
    maxTokens: 1000,
    timeout: 10_000,
    maxRetries: 2,
    streaming: false,
  },
} as const;
