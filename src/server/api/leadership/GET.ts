import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { leadershipTeam } from '../../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const all = req.query.all === 'true';
    if (all && !await requireAdmin(req, res, 'leadership')) return;
    const rows = all
      ? await db.select().from(leadershipTeam).orderBy(asc(leadershipTeam.sortOrder))
      : await db.select().from(leadershipTeam).where(eq(leadershipTeam.active, true)).orderBy(asc(leadershipTeam.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
