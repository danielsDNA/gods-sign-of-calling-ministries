// ============================================================
// useLoading Hook
// ============================================================
// Controls the full-page loading screen on first visit.
// The loading screen shows for ~1800ms then fades out.
// ============================================================

import { useState, useEffect } from 'react';

export function useLoading(duration = 1800) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return { isLoading };
}
