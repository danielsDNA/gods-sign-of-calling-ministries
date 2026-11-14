import { useEffect, useRef, useState } from 'react';

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

    globalThis.fetch(`/api/page-content?page=${encodeURIComponent(page)}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(`Page content request failed (${response.status})`);
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object' || !('content' in result)) {
          throw new Error('CMS returned invalid page content');
        }
        if (active) setState({ content: (result as { content: T }).content, loaded: true });
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
