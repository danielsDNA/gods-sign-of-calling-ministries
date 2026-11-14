import type { Request, Response } from 'express';
import { requireAdmin } from '../../auth.js';
import { moveRecordToTrash } from '../../../../lib/trash.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
    if (!await moveRecordToTrash('gallery_images', id, user.id)) return res.status(404).json({ error: 'Gallery image not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to move gallery image to Trash:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to delete gallery image' });
  }
}
