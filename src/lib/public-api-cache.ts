const CACHE_DURATION_MS = 60_000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

export function fetchPublicJson(path: string): Promise<unknown> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

  const pending = inFlight.get(path);
  if (pending) return pending;

  const request = fetch(path)
    .then(async response => {
      if (!response.ok) throw new Error(`Public request failed (${response.status})`);
      const value: unknown = await response.json();
      cache.set(path, { value, expiresAt: Date.now() + CACHE_DURATION_MS });
      return value;
    })
    .finally(() => inFlight.delete(path));

  inFlight.set(path, request);
  return request;
}

export function updatePublicJsonCache(path: string, value: unknown): void {
  cache.set(path, { value, expiresAt: Date.now() + CACHE_DURATION_MS });
}

export function invalidatePublicJsonCache(path?: string): void {
  if (path) cache.delete(path);
  else cache.clear();
}
