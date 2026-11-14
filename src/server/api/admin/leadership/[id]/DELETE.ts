import type { Request, Response } from 'express';
import { requireAdmin } from '../../auth.js';
import { moveRecordToTrash } from '../../../../lib/trash.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
    if (!await moveRecordToTrash('leadership_team', id, user.id)) return res.status(404).json({ error: 'Leader not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
