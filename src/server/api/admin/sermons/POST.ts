import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { sermons } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, speaker, series, scripture, description, preachedOn, mediaType, mediaUrl, thumbnailUrl, featured, published } = req.body;
    if (!title || !mediaUrl) return res.status(400).json({ error: 'title and mediaUrl are required' });
    const [result] = await db.insert(sermons).values({ title, speaker, series, scripture, description, preachedOn: preachedOn || null, mediaType: mediaType || 'youtube', mediaUrl, thumbnailUrl, featured: !!featured, published: published !== false }).returning({ id: sermons.id });
    res.status(201).json({ ok: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
