export type SermonMedia =
  | { kind: 'audio' | 'video' | 'link'; url: string }
  | { kind: 'embed'; url: string; provider: 'youtube' | 'tiktok' | 'vimeo' }
  | { kind: 'empty' };

type ParsedUrl = InstanceType<typeof globalThis.URL>;

export function parseHttpsMediaUrl(value: string): ParsedUrl | null {
  try {
    const url = new globalThis.URL(value.trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isHostOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function youtubeEmbedUrl(url: ParsedUrl): string | null {
  let videoId = '';
  if (url.hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] || '';
  } else if (isHostOrSubdomain(url.hostname, 'youtube.com')) {
    const segments = url.pathname.split('/').filter(Boolean);
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live'].includes(segments[0] || '')) videoId = segments[1] || '';
  }

  return /^[\w-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
    : null;
}

function tiktokEmbedUrl(url: ParsedUrl): string | null {
  if (!isHostOrSubdomain(url.hostname, 'tiktok.com')) return null;
  const videoId = url.pathname.match(/^\/@[^/]+\/video\/(\d+)/)?.[1];
  return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
}

function vimeoEmbedUrl(url: ParsedUrl): string | null {
  if (!isHostOrSubdomain(url.hostname, 'vimeo.com')) return null;
  const videoId = url.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
}

export function isVideoMediaUrl(value: string): boolean {
  try {
    const url = new globalThis.URL(value.trim(), 'https://media.invalid');
    return /\.(?:mp4|webm|ogv|ogg|mov|m4v)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function isVideoPlatformUrl(value: string): boolean {
  const url = parseHttpsMediaUrl(value);
  if (!url) return false;
  return url.hostname === 'youtu.be'
    || isHostOrSubdomain(url.hostname, 'youtube.com')
    || isHostOrSubdomain(url.hostname, 'tiktok.com')
    || isHostOrSubdomain(url.hostname, 'vimeo.com');
}

export function resolveSermonMedia(value: string, mediaType: string | null | undefined): SermonMedia {
  const url = parseHttpsMediaUrl(value);
  if (!url) return { kind: 'empty' };
  if (mediaType === 'audio') return { kind: 'audio', url: url.toString() };

  const embedUrl = youtubeEmbedUrl(url);
  if (embedUrl) return { kind: 'embed', url: embedUrl, provider: 'youtube' };

  const tiktokUrl = tiktokEmbedUrl(url);
  if (tiktokUrl) return { kind: 'embed', url: tiktokUrl, provider: 'tiktok' };

  const vimeoUrl = vimeoEmbedUrl(url);
  if (vimeoUrl) return { kind: 'embed', url: vimeoUrl, provider: 'vimeo' };

  if (mediaType === 'video' || isVideoMediaUrl(url.toString())) {
    return { kind: 'video', url: url.toString() };
  }
  return { kind: 'link', url: url.toString() };
}
