import type { NextFunction, Request, RequestHandler, Response } from 'express';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  message: string;
  maxWindowMs?: number;
}

interface RateBucket {
  count: number;
  resetAt: number;
  blockedAttempts: number;
}

export function createRateLimiter({ limit, windowMs, message, maxWindowMs = 24 * 60 * 60 * 1000 }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, RateBucket>();
  let lastPrunedAt = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (now - lastPrunedAt > 60_000) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt + maxWindowMs <= now) buckets.delete(key);
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
      const blockedAttempts = bucket && now - bucket.resetAt <= maxWindowMs
        ? bucket.blockedAttempts
        : 0;
      buckets.set(key, { count: 1, resetAt: now + windowMs, blockedAttempts });
      next();
      return;
    }

    if (bucket.count >= limit) {
      const delayMs = Math.min(windowMs * (2 ** bucket.blockedAttempts), maxWindowMs);
      bucket.blockedAttempts += 1;
      bucket.resetAt = now + delayMs;
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil(delayMs / 1000))));
      res.status(429).json({ error: message });
      return;
    }

    bucket.count += 1;
    next();
  };
}
