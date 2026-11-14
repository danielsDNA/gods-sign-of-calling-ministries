import type { Request, Response } from 'express';
import { desc } from 'drizzle-orm';

import { adminTrash } from '../../../db/schema.js';
import { db } from '../../../db/supabase-client.js';
import { requireAdmin } from '../auth.js';

function getSummary(recordType: string, value: unknown): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Deleted record';
  const record = value as Record<string, unknown>;
  const preferred = ['title', 'name', 'label', 'phrase', 'key', 'caption', 'topic'];
  const summary = preferred.map(key => record[key]).find(item => typeof item === 'string' && item.trim());
  return typeof summary === 'string' ? summary : recordType.replaceAll('_', ' ');
}

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Super Admin access is required.' });

  try {
    const rows = await db.select({
      id: adminTrash.id,
      recordType: adminTrash.recordType,
      recordId: adminTrash.recordId,
      recordData: adminTrash.recordData,
      deletedAt: adminTrash.deletedAt,
    }).from(adminTrash).orderBy(desc(adminTrash.deletedAt));
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(rows.map(row => ({
      id: row.id,
      recordType: row.recordType,
      recordId: row.recordId,
      summary: getSummary(row.recordType, row.recordData),
      deletedAt: row.deletedAt,
    })));
  } catch (error) {
    console.error('Unable to load admin trash:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to load Trash.' });
  }
}
