import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que maneja un mensaje que se limpia automáticamente tras un timeout.
 * Previene memory leaks limpiando el timer al desmontar.
 */
export function useAutoCleanMessage(timeoutMs = 4000): [string | null, (msg: string | null) => void] {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), timeoutMs);
    return () => clearTimeout(timer);
  }, [message, timeoutMs]);

  const setMessageClean = useCallback((msg: string | null) => {
    setMessage(msg);
  }, []);

  return [message, setMessageClean];
}
