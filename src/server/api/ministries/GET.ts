import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { ministries } from '../../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const all = req.query.all === 'true';
    if (all && !await requireAdmin(req, res, 'ministries')) return;
    const rows = all
      ? await db.select().from(ministries).orderBy(asc(ministries.sortOrder))
      : await db.select().from(ministries).where(eq(ministries.active, true)).orderBy(asc(ministries.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
