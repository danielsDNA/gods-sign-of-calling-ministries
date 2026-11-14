import type { Request, Response } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../../db/supabase-client.js';
import { adminTrash, heroPhrases } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { phrases } = req.body as { phrases?: string[] };
    if (!Array.isArray(phrases) || phrases.some((phrase) => typeof phrase !== 'string')) {
      return res.status(400).json({ error: 'phrases must be an array of strings' });
    }

    await db.transaction(async tx => {
      const existing = await tx.select().from(heroPhrases).orderBy(asc(heroPhrases.sortOrder));
      const pendingPositions = new Map<string, number[]>();
      phrases.forEach((phrase, index) => {
        const positions = pendingPositions.get(phrase) || [];
        positions.push(index);
        pendingPositions.set(phrase, positions);
      });

      for (const row of existing) {
        const positions = pendingPositions.get(row.phrase);
        const sortOrder = positions?.shift();
        if (sortOrder === undefined) {
          const [removed] = await tx.delete(heroPhrases).where(eq(heroPhrases.id, row.id)).returning();
          if (removed) {
            await tx.insert(adminTrash).values({
              recordType: 'hero_phrases',
              recordId: String(removed.id),
              recordData: removed,
              deletedBy: admin.id,
            });
          }
          continue;
        }
        await tx.update(heroPhrases)
          .set({ sortOrder, active: true })
          .where(eq(heroPhrases.id, row.id));
      }

      const newPhrases = phrases.flatMap((phrase, index) => {
        const positions = pendingPositions.get(phrase);
        if (positions?.includes(index)) {
          positions.splice(positions.indexOf(index), 1);
          return [{ phrase, sortOrder: index, active: true }];
        }
        return [];
      });
      if (newPhrases.length > 0) await tx.insert(heroPhrases).values(newPhrases);
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save phrases', message: String(err) });
  }
}
