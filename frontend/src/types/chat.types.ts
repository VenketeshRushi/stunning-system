import type { ComponentType } from "react";

// ============================================================
// Dataset Types
// ============================================================

export type DatasetType =
  | "csv"
  | "pdf"
  | "txt"
  | "audio"
  | "md"
  | "ppt"
  | "xlsx";

export interface Dataset {
  type: DatasetType;
  title: string;
  image?: string;
}

// ============================================================
// Model & Style Types
// ============================================================

export interface StyleItem {
  name: string;
  badge?: string;
}

export interface Model {
  name: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

// ============================================================
// Message Types
// ============================================================

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "sent" | "error" | "streaming";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  model?: string;
  tokens?: number;
  reaction?: "like" | "dislike" | null;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
  status?: MessageStatus;
  tempId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// ============================================================
// Session Types
// ============================================================

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages?: Message[];
  metadata?: Record<string, unknown>;
}

// ============================================================
// Request/Response Types
// ============================================================

export interface ChatCompletionRequest {
  message: string;
  model: string;
  sessionId?: string;
  style?: string;
  webSearch?: boolean;
  thinkingMode?: boolean;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  sessionId: string;
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================
// Error Types (Aligned with Axios Instance)
// ============================================================

/**
 * Application error type - matches axios instance NormalizedError
 * This is the standard error format throughout the application
 */
export interface AppError {
  status: number | null;
  type?: string | null;
  message: string;
  data?: unknown;
}

/**
 * API error response body from backend
 */
export interface ApiErrorResponseBody {
  type?: string;
  message?: string;
  data?: unknown;
}

/**
 * Helper type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as AppError).message === "string"
  );
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      status: null,
      type: "unknown",
      message: error.message,
    };
  }

  return {
    status: null,
    type: "unknown",
    message: "An unknown error occurred",
  };
}

// ============================================================
// Callback Types
// ============================================================

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string, fullContent: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: AppError) => void;
}

// ============================================================
// State Types
// ============================================================

export interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: AppError | null;
}

// ============================================================
// Settings Types
// ============================================================

export interface ChatSettings {
  model: Model;
  datasets: Dataset[];
  style: StyleItem | null;
  webSearch: boolean;
  extendedThinking: boolean;
}

// ============================================================
// Component Props Types
// ============================================================

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (data: ChatInputData) => void;
  settings: ChatSettings;
  onSettingsChange: (settings: Partial<ChatSettings>) => void;
  availableDatasets: Dataset[];
  onAttachFile?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  stopGenerating?: () => void;
}

export interface ChatInputData {
  message: string;
  model: Model;
  datasets: Dataset[];
  style: StyleItem | null;
  webSearch: boolean;
  extendedThinking: boolean;
}

export interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading?: boolean;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
}

export interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onReact?: (messageId: string, reaction: "like" | "dislike" | null) => void;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message?: string;
  data: T;
  error?: ApiErrorResponseBody;
  errorCode?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  supportsImages: boolean;
  supportsStreaming: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// ============================================================
// Pagination Types
// ============================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
  before?: string;
  after?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// ============================================================
// Utility Types
// ============================================================

/**
 * Make specified properties required
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specified properties optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Extract keys of type T that have values of type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
