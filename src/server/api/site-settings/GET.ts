import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { siteSettings, heroPhrases, serviceTimes } from '../../db/schema.js';
import { asc, eq } from 'drizzle-orm';
import { requireAdmin } from '../admin/auth.js';

export default async function handler(req: Request, res: Response) {
  const includePrivateSettings = req.query.all === 'true';
  if (includePrivateSettings && !await requireAdmin(req, res)) return;
  try {
    const [settings, phrases, times] = await Promise.all([
      db.select().from(siteSettings),
      db.select().from(heroPhrases)
        .where(eq(heroPhrases.active, true))
        .orderBy(asc(heroPhrases.sortOrder)),
      db.select().from(serviceTimes)
        .where(eq(serviceTimes.active, true))
        .orderBy(asc(serviceTimes.sortOrder)),
    ]);

    const map: Record<string, string> = {};
    for (const row of settings) {
      if (row.key === 'contact_notification_email' && !includePrivateSettings) continue;
      map[row.key] = row.value ?? '';
    }

    res.setHeader('Cache-Control', includePrivateSettings
      ? 'private, no-store'
      : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.json({
      settings: map,
      phrases: phrases.map(phrase => phrase.phrase),
      serviceTimes: times,
    });
  } catch (error) {
    console.error('Unable to load public site settings:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to load site settings.' });
  }
}
