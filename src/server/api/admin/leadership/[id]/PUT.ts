import type { Request, Response } from 'express';
import { db } from '../../../../db/supabase-client.js';
import { leadershipTeam } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, title, bio, imageUrl, email, sortOrder, active } = req.body;
    await db.update(leadershipTeam).set({ name, title, bio, imageUrl, email, sortOrder, active: !!active }).where(eq(leadershipTeam.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
