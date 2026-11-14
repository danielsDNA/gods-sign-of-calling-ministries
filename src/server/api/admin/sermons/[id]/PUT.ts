import type { Request, Response } from 'express';
import { db } from '../../../../db/supabase-client.js';
import { sermons } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { title, speaker, series, scripture, description, preachedOn, mediaType, mediaUrl, thumbnailUrl, featured, published } = req.body;
    await db.update(sermons).set({ title, speaker, series, scripture, description, preachedOn: preachedOn || null, mediaType, mediaUrl, thumbnailUrl, featured: !!featured, published: !!published }).where(eq(sermons.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
