import { useEffect, useRef } from "react";

/**
 * Hook to manage AbortController with automatic cleanup
 * React Compiler optimizes this automatically
 */
export default function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSignal = (): AbortSignal => {
    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const isAborted = (): boolean => {
    return abortControllerRef.current?.signal.aborted ?? false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return { getSignal, abort, isAborted };
}
