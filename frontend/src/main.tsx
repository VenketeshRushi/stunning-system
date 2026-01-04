// import { StrictMode } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import RootProvider from "./providers/RootProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { logError } from "./utils/errorLogger";

const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  logError(error, errorInfo);
};

// Catch non-React errors (async, promises, etc.)
window.addEventListener("unhandledrejection", event => {
  logError(
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
  );
});

window.addEventListener("error", event => {
  if (event.error instanceof Error) {
    logError(event.error);
  }
});

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <ErrorBoundary onError={handleError}>
    <RootProvider>
      <App />
    </RootProvider>
  </ErrorBoundary>
  // </StrictMode>
);
