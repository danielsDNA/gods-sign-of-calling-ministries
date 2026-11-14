import type { Request, Response } from 'express';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ ok: true, email: user.email, displayName: user.displayName, role: user.role, permissions: user.permissions });
}
