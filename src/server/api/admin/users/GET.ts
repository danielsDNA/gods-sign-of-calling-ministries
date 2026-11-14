import type { Request, Response } from 'express';
import { asc } from 'drizzle-orm';
import { db } from '../../../db/supabase-client.js';
import { adminUsers } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Owner access is required' });

  try {
    const users = await db.select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      permissions: adminUsers.permissions,
      createdAt: adminUsers.createdAt,
    }).from(adminUsers).orderBy(asc(adminUsers.email));
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Unable to load admin accounts.' });
  }
}
