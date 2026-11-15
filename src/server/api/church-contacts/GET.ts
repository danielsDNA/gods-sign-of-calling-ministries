import type { Request, Response } from 'express';
import { asc, eq } from 'drizzle-orm';

import { churchContacts } from '../../db/schema.js';
import { db } from '../../db/supabase-client.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await db.select().from(churchContacts)
      .where(eq(churchContacts.active, true))
      .orderBy(asc(churchContacts.sortOrder));
    res.json(rows);
  } catch (error) {
    console.error('Unable to load church contacts:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to load church contacts' });
  }
}
