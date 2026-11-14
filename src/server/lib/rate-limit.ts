import type { NextFunction, Request, RequestHandler, Response } from 'express';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  message: string;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs, message }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, RateBucket>();
  let lastPrunedAt = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (now - lastPrunedAt > 60_000) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
      lastPrunedAt = now;
    }

    const key = req.ip || 'unknown';
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= 10_000) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) buckets.delete(oldestKey);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      res.status(429).json({ error: message });
      return;
    }

    bucket.count += 1;
    next();
  };
}
