import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { galleryImages } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { imageUrl, caption, category, sortOrder, active } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
    const [result] = await db.insert(galleryImages).values({ imageUrl, caption, category: category || 'General', sortOrder: sortOrder ?? 0, active: active !== false }).returning({ id: galleryImages.id });
    res.status(201).json({ id: result.id, ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create gallery image' });
  }
}
