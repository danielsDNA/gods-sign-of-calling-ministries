import { describe, expect, it } from 'vitest';
import { createAdminSessionToken, verifyAdminSessionToken } from './admin-session';

const secret = 'a-session-secret-with-at-least-32-characters';

describe('admin session tokens', () => {
  it('accepts a signed, unexpired token for its user', () => {
    const now = 1_800_000_000_000;
    const token = createAdminSessionToken(17, 'bcrypt-hash', secret, now);

    expect(verifyAdminSessionToken(token, 'bcrypt-hash', secret, now + 1)).toBe(17);
  });

  it('rejects modified tokens, changed passwords, and expired tokens', () => {
    const now = 1_800_000_000_000;
    const token = createAdminSessionToken(17, 'bcrypt-hash', secret, now);
    const [id, expiry, version, signature] = token.split('.');
    const modifiedToken = `${id}.${expiry}.${version}.${signature.slice(0, -1)}x`;

    expect(verifyAdminSessionToken(modifiedToken, 'bcrypt-hash', secret, now + 1)).toBeNull();
    expect(verifyAdminSessionToken(token, 'new-bcrypt-hash', secret, now + 1)).toBeNull();
    expect(verifyAdminSessionToken(token, 'bcrypt-hash', secret, now + 7 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it('rejects a token after its server-side session version changes', () => {
    const now = 1_800_000_000_000;
    const token = createAdminSessionToken(17, 'bcrypt-hash', secret, now, 0);

    expect(verifyAdminSessionToken(token, 'bcrypt-hash', secret, now + 1, 0)).toBe(17);
    expect(verifyAdminSessionToken(token, 'bcrypt-hash', secret, now + 1, 1)).toBeNull();
  });

  it('requires a strong signing secret', () => {
    expect(() => createAdminSessionToken(1, 'hash', 'too-short')).toThrow(/at least 32 characters/);
  });
});
