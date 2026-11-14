export const ADMIN_EDITOR_PERMISSIONS = [
  { key: 'sermons', label: 'Manage sermons' },
  { key: 'events', label: 'Manage events' },
  { key: 'requests', label: 'Review requests' },
  { key: 'ministries', label: 'Manage ministries' },
  { key: 'leadership', label: 'Manage leadership' },
  { key: 'gallery', label: 'Manage gallery' },
  { key: 'about-page', label: 'Edit About page' },
  { key: 'ministry-page', label: 'Edit Ministry page' },
  { key: 'site-info', label: 'Edit site information' },
  { key: 'hero', label: 'Edit homepage hero' },
  { key: 'media', label: 'Upload media' },
  { key: 'phrases', label: 'Edit rotating phrases' },
  { key: 'service-times', label: 'Manage service times' },
  { key: 'contacts', label: 'Manage church contacts' },
  { key: 'social', label: 'Manage social links' },
] as const;

export type AdminPermission = typeof ADMIN_EDITOR_PERMISSIONS[number]['key'];
export type AdminRouteRequirement = AdminPermission | 'authenticated' | 'owner';

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] =
  ADMIN_EDITOR_PERMISSIONS.filter(permission => permission.key !== 'hero').map(permission => permission.key);

const permissionByPath: Array<[string, AdminPermission]> = [
  ['/api/admin/sermons', 'sermons'],
  ['/api/admin/events', 'events'],
  ['/api/admin/prayer', 'requests'],
  ['/api/admin/contact-requests', 'requests'],
  ['/api/admin/ministries', 'ministries'],
  ['/api/admin/leadership', 'leadership'],
  ['/api/admin/gallery', 'gallery'],
  ['/api/admin/church-contacts', 'contacts'],
  ['/api/admin/service-times', 'service-times'],
  ['/api/admin/phrases', 'phrases'],
  ['/api/admin/settings', 'site-info'],
];

const authenticatedPaths = new Set([
  '/api/admin/me',
  '/api/admin/bootstrap',
  '/api/admin/password',
  '/api/admin/logout',
  '/api/admin/upload',
]);

const ownerOnlyPaths = [
  '/api/admin/users',
  '/api/admin/trash',
];

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string'
    && ADMIN_EDITOR_PERMISSIONS.some(permission => permission.key === value);
}

export function permissionsForAdminPath(path: string): AdminRouteRequirement | undefined {
  const pathname = path.split('?', 1)[0].replace(/\/+$/, '').toLowerCase();
  const pageContentMatch = pathname.match(/^\/api\/admin\/page-content\/([^/]+)$/);
  if (pageContentMatch?.[1] === 'about') return 'about-page';
  if (pageContentMatch?.[1] === 'ministries') return 'ministry-page';
  if (authenticatedPaths.has(pathname)) return 'authenticated';
  if (ownerOnlyPaths.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return 'owner';

  return permissionByPath.find(([prefix]) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )?.[1];
}
