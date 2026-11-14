import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { events } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, category, description, startsAt, endsAt, location, imageUrl, featured, published } = req.body;
    if (!title || !startsAt) return res.status(400).json({ error: 'title and startsAt are required' });
    const [result] = await db.insert(events).values({ title, category: category || 'Event', description, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, location, imageUrl, featured: !!featured, published: published !== false }).returning({ id: events.id });
    res.status(201).json({ ok: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
