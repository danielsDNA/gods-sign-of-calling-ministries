import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { siteSettings, heroPhrases } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  const includePrivateSettings = req.query.all === 'true';
  if (includePrivateSettings && !await requireAdmin(req, res)) return;
  try {
    const settings = await db.select().from(siteSettings);
    const phrases = await db
      .select()
      .from(heroPhrases)
      .where(eq(heroPhrases.active, true))
      .orderBy(heroPhrases.sortOrder);

    const map: Record<string, string> = {};
    for (const row of settings) {
      if (row.key === 'contact_notification_email' && !includePrivateSettings) continue;
      map[row.key] = row.value ?? '';
    }

    res.json({ settings: map, phrases: phrases.map((p) => p.phrase) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings', message: String(err) });
  }
}
