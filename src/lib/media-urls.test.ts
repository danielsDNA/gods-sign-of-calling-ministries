import { describe, expect, it } from 'vitest';

import { isVideoMediaUrl, isVideoPlatformUrl, parseHttpsMediaUrl, resolveSermonMedia } from './media-urls';

describe('media URL helpers', () => {
  it('only accepts secure URLs without embedded credentials', () => {
    expect(parseHttpsMediaUrl('https://cdn.example.org/photo.jpg')?.hostname).toBe('cdn.example.org');
    expect(parseHttpsMediaUrl('http://cdn.example.org/photo.jpg')).toBeNull();
    expect(parseHttpsMediaUrl('javascript:alert(1)')).toBeNull();
    expect(parseHttpsMediaUrl('https://user:pass@cdn.example.org/photo.jpg')).toBeNull();
  });

  it('recognizes HTTPS direct video files', () => {
    expect(isVideoMediaUrl('https://cdn.example.org/service.mp4?token=abc')).toBe(true);
    expect(isVideoMediaUrl('https://cdn.example.org/photo.jpg')).toBe(false);
  });

  it('embeds YouTube, TikTok, and Vimeo videos from their official domains', () => {
    expect(resolveSermonMedia('https://youtu.be/abcdefghijk', 'youtube')).toEqual({
      kind: 'embed',
      url: 'https://www.youtube-nocookie.com/embed/abcdefghijk',
      provider: 'youtube',
    });
    expect(resolveSermonMedia('https://www.tiktok.com/@church/video/1234567890', 'video')).toEqual({
      kind: 'embed',
      url: 'https://www.tiktok.com/embed/v2/1234567890',
      provider: 'tiktok',
    });
    expect(resolveSermonMedia('https://vimeo.com/123456789', 'video')).toEqual({
      kind: 'embed',
      url: 'https://player.vimeo.com/video/123456789',
      provider: 'vimeo',
    });
    expect(isVideoPlatformUrl('https://youtube.com.evil.example/watch?v=abcdefghijk')).toBe(false);
  });

  it('uses direct playback for uploaded videos and a safe external link for other sources', () => {
    expect(resolveSermonMedia('https://media.example.org/sermon.webm', 'video')).toEqual({
      kind: 'video',
      url: 'https://media.example.org/sermon.webm',
    });
    expect(resolveSermonMedia('https://trusted.example.org/watch/123', 'link')).toEqual({
      kind: 'link',
      url: 'https://trusted.example.org/watch/123',
    });
    expect(resolveSermonMedia('javascript:alert(1)', 'video')).toEqual({ kind: 'empty' });
  });
});
