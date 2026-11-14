import type { Request, Response } from 'express';

import { restoreTrashRecord } from '../../../../../lib/trash.js';
import { requireAdmin } from '../../../auth.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Super Admin access is required.' });

  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid Trash record id.' });

  try {
    const recordType = await restoreTrashRecord(id);
    if (!recordType) return res.status(404).json({ error: 'Trash record not found.' });
    res.json({ ok: true, recordType });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    if (code === '23505') {
      return res.status(409).json({ error: 'This record conflicts with existing data. Remove or rename the current record before restoring it.' });
    }
    console.error('Unable to restore Trash record:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to restore this record.' });
  }
}
