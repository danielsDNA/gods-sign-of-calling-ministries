import type { Request, Response } from 'express';
import { db } from '../../../../db/supabase-client.js';
import { prayerRequests } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../auth.js';
import { sendSiteNotification } from '../../../../lib/resend.js';

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid request id.' });
    const body = req.body as { status?: unknown; adminNote?: unknown; reply?: unknown } | null;
    const reply = typeof body?.reply === 'string' ? body.reply.trim() : '';
    const status = body?.status;
    const adminNote = body?.adminNote;
    if (reply.length > 5000) return res.status(400).json({ error: 'Reply must be 5,000 characters or fewer.' });
    if (status !== undefined && typeof status !== 'string') return res.status(400).json({ error: 'Invalid request status.' });
    if (adminNote !== undefined && typeof adminNote !== 'string') return res.status(400).json({ error: 'Invalid internal note.' });

    if (reply) {
      const [request] = await db.select().from(prayerRequests).where(eq(prayerRequests.id, id)).limit(1);
      if (!request) return res.status(404).json({ error: 'Prayer request not found.' });
      if (!request.email) return res.status(400).json({ error: 'This prayer request has no email address for a reply.' });
      await sendSiteNotification(
        request.email,
        'A response to your prayer request',
        `Hello ${request.name || 'friend'},\n\n${reply}\n\nGod's Sign of Calling Revival Ministries`,
      );
    }

    if (status !== undefined || adminNote !== undefined) {
      const updates: { status?: string; adminNote?: string; updatedAt: Date } = { updatedAt: new Date() };
      if (typeof status === 'string') updates.status = status;
      if (typeof adminNote === 'string') updates.adminNote = adminNote;
      const [updated] = await db.update(prayerRequests)
        .set(updates)
        .where(eq(prayerRequests.id, id))
        .returning({ id: prayerRequests.id });
      if (!updated) return res.status(404).json({ error: 'Prayer request not found.' });
    } else if (!reply) {
      return res.status(400).json({ error: 'Provide a status, internal note, or email reply.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to update prayer request:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to update prayer request.' });
  }
}
