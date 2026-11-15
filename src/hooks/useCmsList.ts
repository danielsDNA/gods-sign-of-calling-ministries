import { useEffect, useRef, useState } from 'react';
import { fetchPublicJson } from '@/lib/public-api-cache';

interface CmsListState<T> {
  items: T[];
  usingFallback: boolean;
  loading: boolean;
  error: string | null;
}

export function useCmsList<T>(path: string, fallback: T[]): CmsListState<T> {
  const [state, setState] = useState<CmsListState<T>>({ items: fallback, usingFallback: true, loading: true, error: null });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    let active = true;
    let cachedItems: T[] | null = null;
    setState(current => ({ ...current, loading: true, error: null }));

    try {
      const cachedValue = window.localStorage.getItem(`public-cms-list:${path}`);
      if (cachedValue !== null) {
        const parsed: unknown = JSON.parse(cachedValue);
        if (Array.isArray(parsed)) {
          cachedItems = parsed as T[];
          setState({ items: cachedItems, usingFallback: true, loading: true, error: null });
        } else {
          console.error(`Cached public CMS content for ${path} is invalid.`);
        }
      }
    } catch (error: unknown) {
      console.error(`Unable to read cached public CMS content for ${path}:`, error);
    }

    fetchPublicJson(path)
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('CMS returned an invalid list');
        const items = rows as T[];
        if (active) {
          setState({ items, usingFallback: false, loading: false, error: null });
          try {
            window.localStorage.setItem(`public-cms-list:${path}`, JSON.stringify(items));
          } catch (error: unknown) {
            console.error(`Unable to cache public CMS content for ${path}:`, error);
          }
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error(`Unable to load public CMS content from ${path}:`, error);
        setState({
          items: cachedItems ?? fallbackRef.current,
          usingFallback: true,
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load CMS content.',
        });
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
