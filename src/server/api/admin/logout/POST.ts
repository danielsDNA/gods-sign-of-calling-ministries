import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  res.clearCookie('admin_session', { path: '/' });
  res.json({ ok: true });
}
