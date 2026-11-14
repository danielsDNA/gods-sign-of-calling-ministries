import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/supabase-client.js';
import { contactRequests, siteSettings } from '../../db/schema.js';
import { sendSiteNotification } from '../../lib/resend.js';

const requestWindowMs = 60_000;
const maxRequestsPerWindow = 5;
const recentRequests = new Map<string, { startedAt: number; count: number }>();

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req: Request, res: Response) {
  const now = Date.now();
  const clientKey = req.ip || 'unknown';
  if (recentRequests.size > 1000) {
    for (const [key, request] of recentRequests) {
      if (now - request.startedAt >= requestWindowMs) recentRequests.delete(key);
    }
    if (recentRequests.size > 1000) {
      const keys = recentRequests.keys();
      const firstKey = keys.next().value;
      const oldestKey = firstKey === clientKey ? keys.next().value : firstKey;
      if (oldestKey !== undefined) recentRequests.delete(oldestKey);
    }
  }
  const recent = recentRequests.get(clientKey);
  if (recent && now - recent.startedAt < requestWindowMs && recent.count >= maxRequestsPerWindow) {
    return res.status(429).json({ error: 'Please wait before sending another message.' });
  }
  if (!recent || now - recent.startedAt >= requestWindowMs) {
    recentRequests.set(clientKey, { startedAt: now, count: 1 });
  } else {
    recent.count += 1;
  }

  const body = req.body as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'A valid contact form submission is required.' });
  }
  if (typeof body.name !== 'string' || typeof body.email !== 'string' ||
      typeof body.topic !== 'string' || typeof body.message !== 'string') {
    return res.status(400).json({ error: 'Name, email, topic, and message are required.' });
  }
  if (body.phone !== undefined && typeof body.phone !== 'string') {
    return res.status(400).json({ error: 'Phone must be a text value.' });
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const topic = body.topic.trim();
  const message = body.message.trim();
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!name || name.length > 150 || !isEmail(email) || email.length > 255 ||
      !topic || topic.length > 150 || !message || message.length > 5000 || phone.length > 50) {
    return res.status(400).json({ error: 'Please check the contact form fields and try again.' });
  }

  try {
    const [saved] = await db.insert(contactRequests).values({
      name,
      email,
      phone: phone || null,
      topic,
      message,
    }).returning({ id: contactRequests.id });
    let notificationSent = false;
    try {
      const [notificationSetting] = await db.select().from(siteSettings)
        .where(eq(siteSettings.key, 'contact_notification_email')).limit(1);
      const [churchEmailSetting] = await db.select().from(siteSettings)
        .where(eq(siteSettings.key, 'email')).limit(1);
      const churchEmail = notificationSetting?.value || churchEmailSetting?.value;
      if (churchEmail) {
        await sendSiteNotification(
          churchEmail,
          `Website contact request: ${topic}`,
          [
            `From: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || 'Not provided'}`,
            `Topic: ${topic}`,
            '',
            message,
          ].join('\n'),
        );
        notificationSent = true;
      } else {
        console.error('Contact request saved, but no church notification email is configured.');
      }
    } catch (error) {
      console.error('Contact request email notification failed:', error);
    }

    return res.status(201).json({ ok: true, id: saved.id, notificationSent });
  } catch (error) {
    console.error('Contact request could not be saved:', error);
    return res.status(500).json({ error: 'Unable to save your message right now. Please try again later.' });
  }
}
