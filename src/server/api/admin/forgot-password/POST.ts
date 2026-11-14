import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { sendPasswordResetCode } from '../../../lib/resend.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string };
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db.select({
      id: adminUsers.id,
      email: adminUsers.email,
      resetTokenExpiry: adminUsers.resetTokenExpiry,
    })
      .from(adminUsers).where(eq(adminUsers.email, normalizedEmail)).limit(1);

    if (!user) return res.json({ ok: true, message: 'If that email exists, a reset code has been sent.' });
    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry).getTime() > Date.now()) {
      return res.json({ ok: true, message: 'If that email exists, a reset code has been sent.' });
    }

    const code = randomBytes(32).toString('hex');
    const resetToken = createHash('sha256').update(code).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.update(adminUsers)
      .set({ resetToken, resetTokenExpiry: expiry })
      .where(eq(adminUsers.id, user.id));

    try {
      await sendPasswordResetCode(user.email, code);
    } catch (error) {
      await db.update(adminUsers)
        .set({ resetToken: null, resetTokenExpiry: null })
        .where(eq(adminUsers.id, user.id));
      console.error('Admin password reset email could not be sent:', error instanceof Error ? error.message : 'Unknown email provider error');
      return res.status(503).json({ error: 'Password reset email is unavailable. Please try again later.' });
    }

    res.json({ ok: true, message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('Admin password reset request failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to request a password reset right now.' });
  }
}
