import type { Request, Response } from 'express';
import { asc } from 'drizzle-orm';

import { churchContacts } from '../../../db/schema.js';
import { db } from '../../../db/supabase-client.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const rows = await db.select().from(churchContacts).orderBy(asc(churchContacts.sortOrder));
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(rows);
  } catch (error) {
    console.error('Unable to load admin church contacts:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to load church contacts. Apply the church contacts database migration first.' });
  }
}
