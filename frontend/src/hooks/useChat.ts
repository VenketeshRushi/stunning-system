import { useState, useRef } from "react";
import type {
  Message,
  ChatSession,
  StreamCallbacks,
  AppError,
} from "@/types/chat.types";
import useAbortController from "@/hooks/useAbortController";
import { chatService, type SendMessageParams } from "@/services/chat.service";

interface UseChatOptions {
  initialSessionId?: string;
  initialModel?: string;
  onError?: (error: AppError) => void;
}

interface UseChatReturn {
  messages: Message[];
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: AppError | null;

  sendMessage: (params: Omit<SendMessageParams, "sessionId">) => Promise<void>;
  sendMessageWithStream: (
    params: Omit<SendMessageParams, "sessionId">
  ) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  stopGenerating: () => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (
    messageId: string,
    reaction: "like" | "dislike" | null
  ) => Promise<void>;

  createSession: (
    title?: string,
    model?: string
  ) => Promise<ChatSession | null>;
  loadSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  updateSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;

  clearError: () => void;
  setCurrentSession: (session: ChatSession | null) => void;
}

function generateMessageId(prefix: "temp" | "user" | "assistant"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialModel = "openai:gpt-4o", onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const { getSignal, abort: abortRequest } = useAbortController();
  const isCreatingSessionRef = useRef(false);

  // React Compiler handles memoization - no useCallback needed
  const handleError = (err: unknown) => {
    const appError: AppError = err as AppError;
    setError(appError);
    onError?.(appError);
  };

  const clearError = () => setError(null);

  // ===============================
  // Session Actions
  // ===============================

  const createSession = async (
    title?: string,
    model?: string
  ): Promise<ChatSession | null> => {
    if (isCreatingSessionRef.current) return null;

    isCreatingSessionRef.current = true;
    setIsLoading(true);
    clearError();

    try {
      const newSession = await chatService.createSession({
        title,
        model: model || initialModel,
      });
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      return newSession;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
      isCreatingSessionRef.current = false;
    }
  };

  const loadSessions = async () => {
    setIsLoading(true);
    clearError();

    try {
      const sessionsData = await chatService.getSessions();
      setSessions(sessionsData);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    clearError();

    try {
      const sessionData = await chatService.getSession(sessionId);
      setCurrentSession(sessionData);
      setMessages(sessionData.messages || []);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (sessionId: string, title: string) => {
    try {
      await chatService.updateSession({ sessionId, title });
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title } : s))
      );
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => (prev ? { ...prev, title } : null));
      }
    } catch (err) {
      handleError(err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Optimistic update
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      await chatService.deleteSession(sessionId);
    } catch (err) {
      handleError(err);
      // Reload sessions on error to restore state
      await loadSessions();
    }
  };

  const clearSession = async () => {
    if (!currentSession) return;
    try {
      await chatService.clearSession(currentSession.id);
      setMessages([]);
    } catch (err) {
      handleError(err);
    }
  };

  // ===============================
  // Message Actions
  // ===============================

  const sendMessage = async (params: Omit<SendMessageParams, "sessionId">) => {
    let sessionId = currentSession?.id;
    if (!sessionId) {
      const newSession = await createSession(undefined, params.model);
      if (!newSession) return;
      sessionId = newSession.id;
    }

    setIsLoading(true);
    clearError();

    const userMessage: Message = {
      id: generateMessageId("temp"),
      role: "user",
      content: params.message,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await chatService.sendMessage({ ...params, sessionId });
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [
          ...filtered,
          { ...userMessage, id: result.id, status: "sent" },
          { ...result.message, status: "sent" },
        ];
      });
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithStream = async (
    params: Omit<SendMessageParams, "sessionId">
  ) => {
    let sessionId = currentSession?.id;
    if (!sessionId) {
      const newSession = await createSession(undefined, params.model);
      if (!newSession) return;
      sessionId = newSession.id;
    }

    clearError();

    const userMessage: Message = {
      id: generateMessageId("user"),
      role: "user",
      content: params.message,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    const assistantMessage: Message = {
      id: generateMessageId("assistant"),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      status: "streaming",
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    const callbacks: StreamCallbacks = {
      onStart: () => setIsStreaming(true),
      onToken: (_, fullContent) =>
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, content: fullContent } : m
          )
        ),
      onComplete: fullContent => {
        setIsStreaming(false);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: fullContent, status: "sent" }
              : m
          )
        );
      },
      onError: err => {
        setIsStreaming(false);
        handleError(err);
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      },
    };

    try {
      const signal = getSignal();
      await chatService.sendMessageStream(
        { ...params, sessionId },
        callbacks,
        signal
      );
    } catch (err) {
      console.error("Stream error:", err);
    }
  };

  const regenerate = async (messageId: string) => {
    if (!currentSession) return;

    setIsLoading(true);
    clearError();

    try {
      const result = await chatService.regenerateResponse(
        currentSession.id,
        messageId
      );
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...result.message, status: "sent" } : m
        )
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopGenerating = () => {
    abortRequest();
    setIsStreaming(false);
    setIsLoading(false);

    if (currentSession) {
      chatService.stopGeneration(currentSession.id).catch(console.error);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!currentSession) return;

    try {
      const updatedMessage = await chatService.editMessage(
        currentSession.id,
        messageId,
        content
      );
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? updatedMessage : m))
      );
    } catch (err) {
      handleError(err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentSession) return;

    try {
      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await chatService.deleteMessage(currentSession.id, messageId);
    } catch (err) {
      handleError(err);
      // Reload session on error
      await loadSession(currentSession.id);
    }
  };

  const reactToMessage = async (
    messageId: string,
    reaction: "like" | "dislike" | null
  ) => {
    if (!currentSession) return;

    try {
      // Optimistic update
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, reaction } : m))
      );
      await chatService.reactToMessage(currentSession.id, messageId, reaction);
    } catch (err) {
      handleError(err);
      // Reload session on error
      await loadSession(currentSession.id);
    }
  };

  return {
    messages,
    sessions,
    currentSession,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    sendMessageWithStream,
    regenerate,
    stopGenerating,
    editMessage,
    deleteMessage,
    reactToMessage,
    createSession,
    loadSession,
    loadSessions,
    updateSession,
    deleteSession,
    clearSession,
    clearError,
    setCurrentSession,
  };
}

export default useChat;
