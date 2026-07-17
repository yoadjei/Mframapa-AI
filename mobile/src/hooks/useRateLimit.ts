import { useEffect, useRef, useState } from 'react';
import { onRateLimit } from '../services/api';

/**
 * Returns the number of seconds remaining in a rate-limit window (0 when clear).
 * Consumers can use this to disable refresh buttons and show a countdown timer.
 */
export function useRateLimit(): { secondsRemaining: number; isRateLimited: boolean } {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = onRateLimit((retryAfterMs) => {
      // Clear any existing ticker
      if (timerRef.current) clearInterval(timerRef.current);

      const endsAt = Date.now() + retryAfterMs;
      setSecondsRemaining(Math.ceil(retryAfterMs / 1000));

      timerRef.current = setInterval(() => {
        const remaining = Math.ceil((endsAt - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setSecondsRemaining(0);
        } else {
          setSecondsRemaining(remaining);
        }
      }, 1000);
    });

    return () => {
      unsub();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { secondsRemaining, isRateLimited: secondsRemaining > 0 };
}
