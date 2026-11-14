import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { cmsPageContent } from '../../../db/schema.js';
import { db } from '../../../db/supabase-client.js';
import { requireAdmin } from '../auth.js';

const editorPages = new Set(['about', 'ministries']);
const editorFields: Record<string, Set<string>> = {
  about: new Set(['hero', 'story', 'mission', 'vision', 'stats', 'values', 'scripture', 'cta']),
  ministries: new Set(['intro', 'scripture', 'volunteerCta']),
};

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const page = typeof req.params.page === 'string' ? req.params.page : '';
  if (!editorPages.has(page)) return res.status(403).json({ error: 'This page cannot be edited here' });
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || !req.body.content || typeof req.body.content !== 'object' || Array.isArray(req.body.content)) {
    return res.status(400).json({ error: 'Page content must be a JSON object' });
  }

  try {
    const submitted = req.body.content as Record<string, unknown>;
    const updates = admin.role === 'owner'
      ? submitted
      : Object.fromEntries(Object.entries(submitted).filter(([field]) => editorFields[page].has(field)));
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No editable page fields were provided' });

    const [existing] = await db.select().from(cmsPageContent).where(eq(cmsPageContent.pageKey, page)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Page content was not found' });
    const [updated] = await db.update(cmsPageContent)
      .set({ content: { ...existing.content, ...updates }, updatedAt: new Date() })
      .where(eq(cmsPageContent.pageKey, page))
      .returning({ pageKey: cmsPageContent.pageKey });
    if (!updated) return res.status(404).json({ error: 'Page content was not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error(`Unable to save ${page} page content:`, error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to save page content' });
  }
}
