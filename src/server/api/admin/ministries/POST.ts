import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { ministries } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { name, tagline, description, imageUrl, meetingTime, contactName, contactEmail, sortOrder, active } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const [result] = await db.insert(ministries).values({ name, tagline, description, imageUrl, meetingTime, contactName, contactEmail, sortOrder: sortOrder || 0, active: active !== false }).returning({ id: ministries.id });
    res.status(201).json({ ok: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
