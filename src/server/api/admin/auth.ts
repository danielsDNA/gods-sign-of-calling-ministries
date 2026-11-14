import type { Request, Response } from 'express';
import { db } from '../../db/supabase-client.js';
import { adminUsers } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  ADMIN_SESSION_DURATION_MS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../../admin-session.js';
import {
  isAdminPermission,
  permissionsForAdminPath,
  type AdminPermission,
} from '../../../lib/admin-permissions.js';

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export function setAdminSession(res: Response, userId: number, passwordHash: string): void {
  const token = createAdminSessionToken(userId, passwordHash, sessionSecret());
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_DURATION_MS,
  });
}

export async function requireAdmin(
  req: Request,
  res: Response,
  permissionOverride?: AdminPermission,
): Promise<{ id: number; email: string; displayName: string | null; role: string; permissions: AdminPermission[] } | null> {
  const token = req.cookies?.admin_session;
  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  const decodedId = token.split('.', 1)[0];
  const userId = Number(decodedId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    res.clearCookie('admin_session', { path: '/' });
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  const [user] = await db.select({
    id: adminUsers.id,
    email: adminUsers.email,
    displayName: adminUsers.displayName,
    role: adminUsers.role,
    permissions: adminUsers.permissions,
    passwordHash: adminUsers.passwordHash,
  }).from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  const validUserId = user
    ? verifyAdminSessionToken(token, user.passwordHash, sessionSecret())
    : null;
  if (!user || validUserId !== user.id) {
    res.clearCookie('admin_session', { path: '/' });
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  const role = user.role ?? 'editor';
  const permissions = Array.isArray(user.permissions)
    ? user.permissions.filter(isAdminPermission)
    : [];
  const requiredPermission = permissionOverride ?? permissionsForAdminPath(req.path);
  const isAdminApiPath = req.path.toLowerCase().startsWith('/api/admin/');
  const isMediaUpload = req.path === '/api/admin/upload';
  const canUploadForTask = permissions.some(permission =>
    ['media', 'site-info', 'gallery', 'sermons', 'events', 'ministries', 'leadership', 'hero'].includes(permission)
  );
  if (role !== 'owner' && (
    (isAdminApiPath && !requiredPermission)
    || requiredPermission === 'owner'
    || (requiredPermission !== 'authenticated' && requiredPermission !== undefined && !permissions.includes(requiredPermission))
    || (isMediaUpload && !canUploadForTask)
  )) {
    res.status(403).json({ error: 'You do not have permission to perform this task' });
    return null;
  }
  return { id: user.id, email: user.email ?? '', displayName: user.displayName, role, permissions };
}
