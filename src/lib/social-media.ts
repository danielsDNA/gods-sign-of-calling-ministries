export const SOCIAL_PLATFORMS = [
  { key: 'facebook_url', platform: 'facebook', label: 'Facebook' },
  { key: 'instagram_url', platform: 'instagram', label: 'Instagram' },
  { key: 'youtube_url', platform: 'youtube', label: 'YouTube' },
  { key: 'twitter_url', platform: 'x', label: 'X' },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['platform'];

export interface SocialMediaLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export function getSocialMediaLinks(settings: Record<string, string>): SocialMediaLink[] {
  return SOCIAL_PLATFORMS.flatMap(({ key, platform, label }) => {
    const value = settings[key]?.trim();
    if (!value) return [];

    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !url.hostname) return [];
      return [{ platform, label, href: url.toString() }];
    } catch {
      return [];
    }
  });
}
