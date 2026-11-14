import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { sermons } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const all = req.query.all === 'true';
    if (all && !await requireAdmin(req, res, 'sermons')) return;
    const rows = all
      ? await db.select().from(sermons).orderBy(desc(sermons.createdAt))
      : await db.select().from(sermons).where(eq(sermons.published, true)).orderBy(desc(sermons.createdAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Unable to load sermons. Please try again.' });
  }
}
