import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { galleryImages } from '../../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await db.select().from(galleryImages).where(eq(galleryImages.active, true)).orderBy(asc(galleryImages.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
}
