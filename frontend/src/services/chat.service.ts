import { authAxios } from "@/axios/instance";
import type {
  Message,
  ChatSession,
  ChatCompletionResponse,
  StreamCallbacks,
  ApiResponse,
  ModelInfo,
  UploadedFile,
  AppError,
} from "@/types/chat.types";

// ============================================================
// Types
// ============================================================

export interface SendMessageParams {
  message: string;
  model: string;
  sessionId?: string;
  style?: string;
  webSearch?: boolean;
  thinkingMode?: boolean;
  files?: File[];
}

export interface CreateSessionParams {
  title?: string;
  model?: string;
}

export interface UpdateSessionParams {
  sessionId: string;
  title?: string;
  model?: string;
}

// ============================================================
// Helper Functions
// ============================================================

function createFormData(params: SendMessageParams): FormData {
  const formData = new FormData();
  formData.append("message", params.message);
  formData.append("model", params.model);

  if (params.sessionId) formData.append("sessionId", params.sessionId);
  if (params.style) formData.append("style", params.style);
  if (params.webSearch) formData.append("webSearch", String(params.webSearch));
  if (params.thinkingMode)
    formData.append("thinkingMode", String(params.thinkingMode));

  if (params.files && params.files.length > 0) {
    params.files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
  }

  return formData;
}

// ============================================================
// Chat Message Services
// ============================================================

export async function sendMessage(
  params: SendMessageParams
): Promise<ChatCompletionResponse> {
  const { files, ...jsonParams } = params;

  if (files && files.length > 0) {
    const formData = createFormData(params);
    const response = await authAxios.post<ApiResponse<ChatCompletionResponse>>(
      "/chat/send",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  }

  const response = await authAxios.post<ApiResponse<ChatCompletionResponse>>(
    "/chat/send",
    jsonParams
  );
  return response.data.data;
}

export async function sendMessageStream(
  params: SendMessageParams,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { onStart, onToken, onComplete, onError } = callbacks;
  let fullContent = "";

  try {
    onStart?.();

    const { files, ...jsonParams } = params;

    // Use the same base URL as axios instance
    const baseURL = import.meta.env.VITE_API_URL ?? "/api";
    const response = await fetch(`${baseURL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...jsonParams, stream: true }),
      signal,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: AppError;
      try {
        const parsed = JSON.parse(errorText);
        errorData = {
          status: response.status,
          message: parsed.message || parsed.error?.message || errorText,
          type: parsed.type || parsed.error?.type,
          data: parsed.data || parsed.error?.data,
        };
      } catch {
        errorData = {
          status: response.status,
          message: errorText || `HTTP ${response.status}`,
        };
      }
      throw errorData;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onComplete?.(fullContent);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onComplete?.(fullContent);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content || "";
            if (token) {
              fullContent += token;
              onToken?.(token, fullContent);
            }
          } catch (parseError) {
            console.warn("Failed to parse SSE data:", data, parseError);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      onComplete?.(fullContent);
      return;
    }
    onError?.(error as AppError);
  }
}

export async function regenerateResponse(
  sessionId: string,
  messageId: string
): Promise<ChatCompletionResponse> {
  const response = await authAxios.post<ApiResponse<ChatCompletionResponse>>(
    "/chat/regenerate",
    { sessionId, messageId }
  );
  return response.data.data;
}

export async function stopGeneration(sessionId: string): Promise<void> {
  await authAxios.post("/chat/stop", { sessionId });
}

// ============================================================
// Chat Session Services
// ============================================================

export async function createSession(
  params?: CreateSessionParams
): Promise<ChatSession> {
  const response = await authAxios.post<ApiResponse<ChatSession>>(
    "/sessions",
    params || {}
  );
  return response.data.data;
}

export async function getSessions(): Promise<ChatSession[]> {
  const response = await authAxios.get<ApiResponse<ChatSession[]>>("/sessions");
  return response.data.data;
}

export async function getSession(sessionId: string): Promise<ChatSession> {
  const response = await authAxios.get<ApiResponse<ChatSession>>(
    `/sessions/${sessionId}`
  );
  return response.data.data;
}

export async function updateSession(
  params: UpdateSessionParams
): Promise<ChatSession> {
  const { sessionId, ...updateData } = params;
  const response = await authAxios.patch<ApiResponse<ChatSession>>(
    `/sessions/${sessionId}`,
    updateData
  );
  return response.data.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await authAxios.delete(`/sessions/${sessionId}`);
}

export async function clearSession(sessionId: string): Promise<void> {
  await authAxios.post(`/sessions/${sessionId}/clear`);
}

// ============================================================
// Message Services
// ============================================================

export async function getMessages(
  sessionId: string,
  options?: { limit?: number; before?: string }
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.before) params.append("before", options.before);

  const queryString = params.toString();
  const url = queryString
    ? `/sessions/${sessionId}/messages?${queryString}`
    : `/sessions/${sessionId}/messages`;

  const response = await authAxios.get<ApiResponse<Message[]>>(url);
  return response.data.data;
}

export async function deleteMessage(
  sessionId: string,
  messageId: string
): Promise<void> {
  await authAxios.delete(`/sessions/${sessionId}/messages/${messageId}`);
}

export async function editMessage(
  sessionId: string,
  messageId: string,
  content: string
): Promise<Message> {
  const response = await authAxios.patch<ApiResponse<Message>>(
    `/sessions/${sessionId}/messages/${messageId}`,
    { content }
  );
  return response.data.data;
}

export async function reactToMessage(
  sessionId: string,
  messageId: string,
  reaction: "like" | "dislike" | null
): Promise<void> {
  await authAxios.post(`/sessions/${sessionId}/messages/${messageId}/react`, {
    reaction,
  });
}

// ============================================================
// Model Services
// ============================================================

export async function getModels(): Promise<ModelInfo[]> {
  const response = await authAxios.get<ApiResponse<ModelInfo[]>>("/models");
  return response.data.data;
}

// ============================================================
// File Upload Services
// ============================================================

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(`file_${index}`, file));

  const response = await authAxios.post<ApiResponse<UploadedFile[]>>(
    "/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  await authAxios.delete(`/upload/${fileId}`);
}

// ============================================================
// Export Service Object
// ============================================================

export const chatService = {
  sendMessage,
  sendMessageStream,
  regenerateResponse,
  stopGeneration,
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  clearSession,
  getMessages,
  deleteMessage,
  editMessage,
  reactToMessage,
  getModels,
  uploadFiles,
  deleteFile,
};

export default chatService;
