import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function signature(payload: string, passwordHash: string, secret: string): Buffer {
  if (secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters');
  }
  return createHmac('sha256', secret).update(`${payload}.${passwordHash}`).digest();
}

export function createAdminSessionToken(
  userId: number,
  passwordHash: string,
  secret: string,
  now = Date.now(),
  sessionVersion = 0,
): string {
  const expiresAt = now + ADMIN_SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}.${sessionVersion}`;
  return `${payload}.${signature(payload, passwordHash, secret).toString('base64url')}`;
}

export function verifyAdminSessionToken(
  token: string,
  passwordHash: string,
  secret: string,
  now = Date.now(),
  sessionVersion = 0,
): number | null {
  const [idPart, expiryPart, versionPart, encodedSignature, ...extra] = token.split('.');
  if (!idPart || !expiryPart || !versionPart || !encodedSignature || extra.length > 0) return null;

  const id = Number(idPart);
  const expiresAt = Number(expiryPart);
  const tokenVersion = Number(versionPart);
  if (
    !Number.isSafeInteger(id)
    || id < 1
    || !Number.isSafeInteger(expiresAt)
    || expiresAt <= now
    || !Number.isSafeInteger(tokenVersion)
    || tokenVersion !== sessionVersion
  ) {
    return null;
  }

  const payload = `${id}.${expiresAt}.${tokenVersion}`;
  const expected = signature(payload, passwordHash, secret);
  const actual = Buffer.from(encodedSignature, 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? id : null;
}
