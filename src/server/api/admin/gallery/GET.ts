import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { galleryImages } from '../../../db/schema.js';
import { asc } from 'drizzle-orm';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
}
