import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin, setAdminSession } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
    if (!user) return res.status(401).json({ error: 'Session expired' });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.id, admin.id));
    setAdminSession(res, admin.id, hash);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password', message: String(err) });
  }
}
