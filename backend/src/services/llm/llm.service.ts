import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  AIMessageChunk,
  BaseMessage,
} from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { IterableReadableStream } from '@langchain/core/utils/stream';

import { config } from '../../config/index.js';
import { LLMProvider } from './llm.types.js';

export interface LLMConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
  streaming?: boolean;
}

interface LLMConfigStreaming extends LLMConfig {
  streaming: true;
}

interface LLMConfigNonStreaming extends LLMConfig {
  streaming?: false;
}

interface CallOptionsBase {
  userMessage: string;
  systemMessage?: string;
}

interface CallOptionsStreaming extends CallOptionsBase {
  config: LLMConfigStreaming;
}

interface CallOptionsNonStreaming extends CallOptionsBase {
  config?: LLMConfigNonStreaming;
}

type CallOptions = CallOptionsStreaming | CallOptionsNonStreaming;

function createLLMInstance(
  provider: LLMProvider,
  finalConfig: Required<LLMConfig>
): BaseChatModel {
  const providerConfig = (config.llm.providers as Record<LLMProvider, any>)[
    provider
  ];

  switch (provider) {
    case LLMProvider.OPENAI:
      return new ChatOpenAI({
        apiKey: providerConfig.apiKey,
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        maxTokens: finalConfig.maxTokens,
        timeout: finalConfig.timeout,
        maxRetries: finalConfig.maxRetries,
        streaming: finalConfig.streaming,
      });

    case LLMProvider.GOOGLE:
      return new ChatGoogleGenerativeAI({
        apiKey: providerConfig.apiKey,
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        maxOutputTokens: finalConfig.maxTokens,
        maxRetries: finalConfig.maxRetries,
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

export async function callLLMModel(
  options: CallOptionsStreaming
): Promise<IterableReadableStream<AIMessageChunk>>;

export async function callLLMModel(
  options: CallOptionsNonStreaming
): Promise<AIMessageChunk>;

export async function callLLMModel(
  options: CallOptions
): Promise<AIMessageChunk | IterableReadableStream<AIMessageChunk>>;

export async function callLLMModel(
  options: CallOptions
): Promise<AIMessageChunk | IterableReadableStream<AIMessageChunk>> {
  const { userMessage, systemMessage, config: llmOverrides } = options;

  if (!userMessage?.trim()) {
    throw new Error('userMessage is required');
  }

  const provider = llmOverrides?.provider ?? config.llm.defaultProvider;

  const providerConfig = config.llm.providers[provider];

  if (!providerConfig) {
    throw new Error(`Configuration not found for provider: ${provider}`);
  }

  const finalConfig: Required<LLMConfig> = {
    provider,
    model: llmOverrides?.model ?? providerConfig.defaultModel,
    temperature: llmOverrides?.temperature ?? config.llm.defaults.temperature,
    maxTokens: llmOverrides?.maxTokens ?? config.llm.defaults.maxTokens,
    timeout: llmOverrides?.timeout ?? config.llm.defaults.timeout,
    maxRetries: llmOverrides?.maxRetries ?? config.llm.defaults.maxRetries,
    streaming: llmOverrides?.streaming ?? config.llm.defaults.streaming,
  };

  const llm = createLLMInstance(provider, finalConfig);

  const messages: BaseMessage[] = [];
  if (systemMessage) messages.push(new SystemMessage(systemMessage));
  messages.push(new HumanMessage(userMessage));

  const callOptions = {
    tags: ['llm', provider],
    metadata: {
      provider,
      model: finalConfig.model,
      streaming: finalConfig.streaming,
    },
  };

  return finalConfig.streaming
    ? llm.stream(messages, callOptions)
    : llm.invoke(messages, callOptions);
}
