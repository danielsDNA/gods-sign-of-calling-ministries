import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import eventsHandler from './events/GET';
import leadershipHandler from './leadership/GET';
import ministriesHandler from './ministries/GET';
import serviceTimesHandler from './service-times/GET';
import { requireAdmin } from './admin/auth';

vi.mock('./admin/auth.js', () => ({ requireAdmin: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ db: { select: vi.fn() } }));

describe('privileged public content reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(null);
  });

  it.each([
    [eventsHandler, 'events'],
    [ministriesHandler, 'ministries'],
    [leadershipHandler, 'leadership'],
    [serviceTimesHandler, 'service-times'],
  ] as const)('requires the %s permission for unpublished data', async (handler, permission) => {
    const req = { query: { all: 'true' } } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await handler(req, res);

    expect(requireAdmin).toHaveBeenCalledWith(req, res, permission);
  });
});
