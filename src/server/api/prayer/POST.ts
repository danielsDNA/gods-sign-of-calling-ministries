import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { prayerRequests } from '../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { name, email, phone, request, isPrivate } = req.body;
    if (!request) return res.status(400).json({ error: 'Prayer request text is required' });
    const [result] = await db.insert(prayerRequests).values({ name, email, phone, request, isPrivate: isPrivate !== false }).returning({ id: prayerRequests.id });
    res.status(201).json({ ok: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
