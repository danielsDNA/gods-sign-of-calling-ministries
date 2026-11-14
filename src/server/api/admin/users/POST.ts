import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Owner access is required' });

  const { email, password, displayName } = req.body as {
    email?: string;
    password?: string;
    displayName?: string;
  };
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
    return res.status(400).json({ error: 'Display name must be 100 characters or fewer' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.insert(adminUsers).values({
      email: email.trim().toLowerCase(),
      passwordHash,
      displayName: displayName?.trim() || null,
      role: 'editor',
    }).returning({ id: adminUsers.id });
    res.status(201).json({ ok: true, id: result.id });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    if (code === '23505') return res.status(409).json({ error: 'An admin account already exists for that email' });
    console.error('Admin account creation failed:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to create the admin account.' });
  }
}
