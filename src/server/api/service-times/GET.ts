import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { serviceTimes } from '../../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const all = req.query.all === 'true';
    if (all && !await requireAdmin(req, res, 'service-times')) return;
    const rows = all
      ? await db.select().from(serviceTimes).orderBy(asc(serviceTimes.sortOrder))
      : await db.select().from(serviceTimes).where(eq(serviceTimes.active, true)).orderBy(asc(serviceTimes.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
