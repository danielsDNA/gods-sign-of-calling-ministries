import { useEffect, useRef, useState } from 'react';
import { fetchPublicJson } from '@/lib/public-api-cache';

interface PageContentState<T> {
  content: T;
  loaded: boolean;
}

export function usePageContent<T>(page: string, fallback: T): PageContentState<T> {
  const [state, setState] = useState<PageContentState<T>>({ content: fallback, loaded: false });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    let active = true;

    const cacheKey = `public-page-content:${page}`;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached !== null) {
        const content: unknown = JSON.parse(cached);
        setState({ content: content as T, loaded: false });
      }
    } catch (error: unknown) {
      console.error(`Unable to read cached public page content for ${page}:`, error);
    }

    fetchPublicJson(`/api/page-content?page=${encodeURIComponent(page)}`)
      .then(result => {
        if (!result || typeof result !== 'object' || !('content' in result)) {
          throw new Error('CMS returned invalid page content');
        }
        const content = (result as { content: T }).content;
        if (active) {
          setState({ content, loaded: true });
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify(content));
          } catch (error: unknown) {
            console.error(`Unable to cache public page content for ${page}:`, error);
          }
        }
      })
      .catch((error: unknown) => {
        console.error(`Unable to load public page content for ${page}:`, error);
        if (active) setState({ content: fallbackRef.current, loaded: true });
      });

    return () => {
      active = false;
    };
  }, [page]);

  return state;
}
