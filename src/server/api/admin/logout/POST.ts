import type { Request, Response } from 'express';
import { revokeAdminSession } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    await revokeAdminSession(req, res);
    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to revoke the admin session:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to securely sign out. Please try again.' });
  }
}
