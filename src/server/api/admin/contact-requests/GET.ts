import type { Request, Response } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../../../db/supabase-client.js';
import { contactRequests } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  if (!await requireAdmin(req, res)) return;
  try {
    const rows = await db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Contact requests could not be loaded:', error);
    res.status(500).json({ error: 'Unable to load contact requests.' });
  }
}
