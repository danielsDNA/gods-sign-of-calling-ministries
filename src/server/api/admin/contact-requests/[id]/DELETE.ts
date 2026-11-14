import type { Request, Response } from 'express';

import { requireAdmin } from '../../auth.js';
import { moveRecordToTrash } from '../../../../lib/trash.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Super Admin access is required to remove requests.' });

  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid request id.' });

  try {
    if (!await moveRecordToTrash('contact_requests', id, admin.id)) {
      return res.status(404).json({ error: 'Contact request not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to move contact request to Trash:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to remove this contact request.' });
  }
}
