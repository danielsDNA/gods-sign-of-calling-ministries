export interface PageSeoUrls {
  pageUrl?: string;
  webpageId?: string;
  websiteId?: string;
  organizationId?: string;
}

export function buildPageSeoUrls(siteUrl: string, path: string): PageSeoUrls {
  const origin = siteUrl.replace(/\/+$/, '');
  if (!origin) return {};
  const pageUrl = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    pageUrl,
    webpageId: `${pageUrl}#webpage`,
    websiteId: `${origin}/#website`,
    organizationId: `${origin}/#organization`,
  };
}
