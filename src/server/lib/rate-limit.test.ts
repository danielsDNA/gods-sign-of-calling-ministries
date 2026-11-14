import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('rejects requests over the limit and reports a retry delay', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, message: 'Please retry later.' });
    const req = { ip: '192.0.2.1' } as Request;
    const next = vi.fn();
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.json).toHaveBeenCalledWith({ error: 'Please retry later.' });
  });
});
