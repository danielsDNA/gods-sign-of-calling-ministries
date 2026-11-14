import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { cmsPageContent } from '../../db/schema.js';
import { db } from '../../db/supabase-client.js';

const publicPages = new Set(['about', 'contact', 'events', 'gallery', 'home', 'ministries', 'sermons']);

export default async function handler(req: Request, res: Response) {
  const page = typeof req.query.page === 'string' ? req.query.page : '';
  if (!publicPages.has(page)) {
    res.status(400).json({ error: 'Invalid page key' });
    return;
  }

  try {
    const [row] = await db.select().from(cmsPageContent).where(eq(cmsPageContent.pageKey, page)).limit(1);
    if (!row) {
      res.status(404).json({ error: 'Page content not found' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({ content: row.content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load page content', message: String(error) });
  }
}
