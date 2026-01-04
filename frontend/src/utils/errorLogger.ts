import type { ErrorInfo } from "react";

export const logError = (error: Error, errorInfo?: ErrorInfo) => {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    console.group("Application Error");
    console.error("Error:", error);
    if (errorInfo) {
      console.error("Component Stack:", errorInfo.componentStack);
    }
    console.groupEnd();
    return;
  }

  // ===============================
  // Production error logging
  // ===============================

  // Example: Sentry
  // Sentry.captureException(error, {
  //   contexts: {
  //     react: {
  //       componentStack: errorInfo?.componentStack,
  //     },
  //   },
  // });

  // Example: Custom backend API
  /*
  fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }),
  });
  */
};
