import type { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';

import { isAdminPermission } from '../../../../../lib/admin-permissions.js';
import { db } from '../../../../db/supabase-client.js';
import { adminUsers } from '../../../../db/schema.js';
import { requireAdmin } from '../../auth.js';

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== 'owner') return res.status(403).json({ error: 'Owner access is required' });

  const id = Number(req.params.id);
  const permissions: unknown = req.body?.permissions;
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid editor account id' });
  if (!Array.isArray(permissions) || permissions.some(permission => !isAdminPermission(permission))) {
    return res.status(400).json({ error: 'Select valid editor permissions' });
  }
  const validPermissions = permissions.filter(isAdminPermission);
  if (validPermissions.length !== permissions.length) {
    return res.status(400).json({ error: 'Select valid editor permissions' });
  }
  const uniquePermissions = [...new Set(validPermissions)];

  try {
    const [updated] = await db.update(adminUsers)
      .set({ permissions: uniquePermissions })
      .where(and(eq(adminUsers.id, id), eq(adminUsers.role, 'editor')))
      .returning({ id: adminUsers.id });
    if (!updated) return res.status(404).json({ error: 'Editor account not found' });
    res.json({ ok: true, permissions: uniquePermissions });
  } catch (error) {
    console.error('Unable to update editor permissions:', error instanceof Error ? error.message : 'Unknown database error');
    res.status(500).json({ error: 'Unable to update editor permissions' });
  }
}
