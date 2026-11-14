import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/supabase-client.js';
import { contactRequests } from '../../../../db/schema.js';
import { requireAdmin } from '../../auth.js';
import { sendSiteNotification } from '../../../../lib/resend.js';

const allowedStatuses = new Set(['new', 'read', 'replied']);

function isAllowedStatus(value: unknown): value is string {
  return typeof value === 'string' && allowedStatuses.has(value);
}

export default async function handler(req: Request, res: Response) {
  if (!await requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  const body = req.body as { status?: unknown; reply?: unknown } | null;
  const status = body?.status;
  const reply = typeof body?.reply === 'string' ? body.reply.trim() : '';
  const validStatus = isAllowedStatus(status);
  if (!Number.isSafeInteger(id) || id <= 0 ||
      (!validStatus && !reply) || reply.length > 5000) {
    return res.status(400).json({ error: 'Provide a valid request status or a reply of no more than 5,000 characters.' });
  }

  try {
    if (reply) {
      const [request] = await db.select().from(contactRequests)
        .where(eq(contactRequests.id, id))
        .limit(1);
      if (!request) return res.status(404).json({ error: 'Contact request not found.' });
      await sendSiteNotification(
        request.email,
        `Re: ${request.topic}`,
        `Hello ${request.name},\n\n${reply}\n\nGod's Sign of Calling Revival Ministries`,
      );
    }

    const nextStatus = reply ? 'replied' : validStatus ? status : 'new';
    const [updated] = await db.update(contactRequests)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(contactRequests.id, id))
      .returning({ id: contactRequests.id });
    if (!updated) return res.status(404).json({ error: 'Contact request not found.' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Contact request status could not be updated:', error);
    res.status(500).json({ error: 'Unable to update contact request.' });
  }
}
