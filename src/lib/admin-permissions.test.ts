import { describe, expect, it } from 'vitest';

import {
  ADMIN_EDITOR_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  permissionsForAdminPath,
} from './admin-permissions';

describe('admin permissions', () => {
  it('keeps hero and account management out of the default editor privileges', () => {
    expect(DEFAULT_ADMIN_PERMISSIONS).not.toContain('hero');
    expect(ADMIN_EDITOR_PERMISSIONS.map(permission => permission.key)).not.toContain('admins');
  });

  it('maps admin API paths to the matching editor permission', () => {
    expect(permissionsForAdminPath('/api/admin/events/12')).toBe('events');
    expect(permissionsForAdminPath('/api/admin/contact-requests/12')).toBe('requests');
    expect(permissionsForAdminPath('/api/admin/page-content/about')).toBe('about-page');
    expect(permissionsForAdminPath('/api/admin/page-content/ministries')).toBe('ministry-page');
    expect(permissionsForAdminPath('/api/admin/me')).toBe('authenticated');
    expect(permissionsForAdminPath('/API/ADMIN/EVENTS/12')).toBe('events');
    expect(permissionsForAdminPath('/api/admin/users/12')).toBe('owner');
    expect(permissionsForAdminPath('/api/admin/unmapped')).toBeUndefined();
  });
});
