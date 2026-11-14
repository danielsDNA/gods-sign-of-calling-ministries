import type { Request, Response } from 'express';
import { db } from '../../../db/supabase-client.js';
import { adminTrash, serviceTimes } from '../../../db/schema.js';
import { eq, notInArray } from 'drizzle-orm';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    // Replace all service times
    const times = req.body as Array<{ id?: number; day: string; time: string; label: string; location?: string; sortOrder?: number; active?: boolean }>;
    if (!Array.isArray(times) || times.some(time =>
      !time || typeof time.day !== 'string' || typeof time.time !== 'string' || typeof time.label !== 'string'
    )) {
      return res.status(400).json({ error: 'Each service time must include a day, time, and label' });
    }

    const ids = times.filter(time => Number.isSafeInteger(time.id) && Number(time.id) > 0).map(time => Number(time.id));
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Service time ids must be unique' });

    await db.transaction(async (tx) => {
      const removed = ids.length > 0
        ? await tx.delete(serviceTimes).where(notInArray(serviceTimes.id, ids)).returning()
        : await tx.delete(serviceTimes).returning();
      if (removed.length > 0) {
        await tx.insert(adminTrash).values(removed.map(row => ({
          recordType: 'service_times',
          recordId: String(row.id),
          recordData: row,
          deletedBy: user.id,
        })));
      }

      for (const time of times) {
        const values = {
          day: time.day.trim(),
          time: time.time.trim(),
          label: time.label.trim(),
          location: time.location?.trim() || null,
          sortOrder: time.sortOrder ?? 0,
          active: time.active !== false,
        };
        if (time.id && ids.includes(time.id)) {
          await tx.update(serviceTimes).set(values).where(eq(serviceTimes.id, time.id));
        } else {
          await tx.insert(serviceTimes).values(values);
        }
      }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: String(err) });
  }
}
