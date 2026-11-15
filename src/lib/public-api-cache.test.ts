import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicJson, invalidatePublicJsonCache, updatePublicJsonCache } from './public-api-cache';

describe('public API cache', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    invalidatePublicJsonCache();
  });

  it('coalesces concurrent requests and reuses the successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: ['cached'] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const path = '/api/cache-test';

    const [first, second] = await Promise.all([fetchPublicJson(path), fetchPublicJson(path)]);
    const third = await fetchPublicJson(path);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ items: ['cached'] });
    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it('allows explicit cache updates and invalidation', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const path = '/api/cache-update-test';
    updatePublicJsonCache(path, { value: 'updated' });

    await expect(fetchPublicJson(path)).resolves.toEqual({ value: 'updated' });
    expect(fetchMock).not.toHaveBeenCalled();

    invalidatePublicJsonCache(path);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ value: 'fresh' }) });
    await expect(fetchPublicJson(path)).resolves.toEqual({ value: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
