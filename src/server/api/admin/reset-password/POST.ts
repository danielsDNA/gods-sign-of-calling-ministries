import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { code, password } = req.body as { code?: string; password?: string };
    if (typeof code !== 'string' || typeof password !== 'string' || !code.trim() || !password) {
      return res.status(400).json({ error: 'Reset code and new password are required' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const resetToken = createHash('sha256').update(code.trim()).digest('hex');
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.resetToken, resetToken)).limit(1);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset code' });

    const expiry = user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null;
    if (!expiry || expiry < new Date()) return res.status(400).json({ error: 'Reset code has expired' });

    const hash = await bcrypt.hash(password, 12);
    await db.update(adminUsers)
      .set({ passwordHash: hash, resetToken: null, resetTokenExpiry: null })
      .where(eq(adminUsers.id, user.id));

    res.json({ ok: true, message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Admin password reset failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to reset the password right now.' });
  }
}
