import type { Request, Response } from 'express';

import { requireAdmin } from '../auth.js';
import { loadAdminBootstrap } from '../../../lib/admin-bootstrap.js';

export default async function handler(req: Request, res: Response) {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const content = await loadAdminBootstrap(user.role, user.permissions);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      user: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
      },
      ...content,
    });
  } catch (error) {
    console.error('Admin dashboard bootstrap failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to load the admin dashboard. Please try again.' });
  }
}
