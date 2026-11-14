import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { events } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const all = req.query.all === 'true';
    if (all && !await requireAdmin(req, res)) return;
    const rows = all
      ? await db.select().from(events).orderBy(desc(events.startsAt))
      : await db.select().from(events).where(eq(events.published, true)).orderBy(desc(events.startsAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
