import type { Request, Response } from 'express';
import { db } from '../../../../db/supabase-client.js';
import { events } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { title, category, description, startsAt, endsAt, location, imageUrl, featured, published } = req.body;
    await db.update(events).set({ title, category, description, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, location, imageUrl, featured: !!featured, published: !!published }).where(eq(events.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
