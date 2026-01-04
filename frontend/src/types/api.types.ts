export type ApiSuccess<T = any> = {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, any>;
};

export type ApiErrorPayload = {
  type?: string;
  message?: string;
  data?: unknown;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorPayload;
  requestId?: string;
  timestamp?: string;
};
