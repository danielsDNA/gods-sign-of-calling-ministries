import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { setAdminSession } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, normalizedEmail)).limit(1);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    setAdminSession(res, user.id, user.passwordHash);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      ok: true,
      user: { email: user.email, displayName: user.displayName, role: user.role, permissions: user.permissions },
    });
  } catch (error) {
    console.error('Admin login failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Login failed. Check the server configuration and try again.' });
  }
}
