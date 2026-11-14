import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { prayerRequests } from '../../../db/schema.js';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
