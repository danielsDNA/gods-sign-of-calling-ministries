import { useEffect, useState } from 'react';

export function useLoading(duration = 1800) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  return { isLoading };
}
