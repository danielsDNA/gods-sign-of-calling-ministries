import { useEffect, useSyncExternalStore } from 'react';
import { churchConfig } from '@/config/church';

export interface ServiceTime {
  id?: number;
  day: string;
  time: string;
  label: string;
  location: string;
}

export interface SiteSettingsData {
  settings: Record<string, string>;
  phrases: string[];
  serviceTimes: ServiceTime[];
  loaded: boolean;
}

const FALLBACK_PHRASES = [
  'Rooted in Psalm 27',
  'Serving Our Communities',
  'Growing Together in Faith',
  'Proclaiming the Good News',
  'A Place to Belong',
];
const CACHE_KEY = 'public-site-settings:v1';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const initialData: SiteSettingsData = {
  settings: {
    church_name: churchConfig.name,
    hero_welcome: "God's Sign of Calling Revival Ministries",
    hero_headline: churchConfig.hero.heading,
    hero_subheading: churchConfig.hero.subheading,
    hero_cta_primary_label: churchConfig.hero.ctaPrimary.label,
    hero_cta_primary_href: churchConfig.hero.ctaPrimary.href,
    hero_cta_secondary_label: churchConfig.hero.ctaSecondary.label,
    hero_cta_secondary_href: churchConfig.hero.ctaSecondary.href,
    hero_photo_url: '',
    hero_highlight: 'to Belong,',
    hero_outline_text: 'A Calling',
    about_image_url: '',
    scripture_banner_image_url: '',
    is_live: 'false',
    live_stream_url: '',
    tagline: churchConfig.tagline,
    phone: churchConfig.phone,
    email: churchConfig.email,
    address: churchConfig.address,
    logo_url: '',
    about_heading: churchConfig.about.heading,
    about_body: '',
    about_mission: churchConfig.about.mission,
    about_vision: churchConfig.about.vision,
    scripture_text: churchConfig.scripture.text,
    scripture_reference: churchConfig.scripture.reference,
    map_address: '',
    map_embed_url: '',
    facebook_url: churchConfig.social.facebook,
    instagram_url: churchConfig.social.instagram,
    youtube_url: churchConfig.social.youtube,
    twitter_url: churchConfig.social.twitter,
    stay_connected_enabled: 'true',
    contact_notification_email: '',
    give_enabled: 'false',
    give_popup_enabled: 'false',
    give_payment_instructions: '',
    event_popup_enabled: 'false',
    whatsapp_float_enabled: 'false',
    whatsapp_float_position: 'right',
    whatsapp_number: '',
  },
  phrases: FALLBACK_PHRASES,
  serviceTimes: churchConfig.serviceTimes,
  loaded: false,
};

let snapshot = initialData;
let initialized = false;
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach(listener => listener());
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every(item => typeof item === 'string');
}

function isServiceTimes(value: unknown): value is ServiceTime[] {
  return Array.isArray(value) && value.every(item =>
    typeof item === 'object'
    && item !== null
    && typeof item.day === 'string'
    && typeof item.time === 'string'
    && typeof item.label === 'string'
    && typeof item.location === 'string',
  );
}

function saveCache(data: SiteSettingsData): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      settings: data.settings,
      phrases: data.phrases,
      serviceTimes: data.serviceTimes,
    }));
  } catch (error) {
    console.error('Unable to cache public site settings:', error);
  }
}

function loadCache(): void {
  if (initialized) return;
  initialized = true;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cached: unknown = JSON.parse(raw);
    if (
      typeof cached !== 'object'
      || cached === null
      || !('savedAt' in cached)
      || typeof cached.savedAt !== 'number'
      || Date.now() - cached.savedAt > CACHE_MAX_AGE_MS
      || cached.savedAt > Date.now()
      || !('settings' in cached)
      || !isStringRecord(cached.settings)
      || !('phrases' in cached)
      || !Array.isArray(cached.phrases)
      || !cached.phrases.every(phrase => typeof phrase === 'string')
      || !('serviceTimes' in cached)
      || !isServiceTimes(cached.serviceTimes)
    ) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    snapshot = {
      settings: { ...initialData.settings, ...cached.settings },
      phrases: cached.phrases.length ? cached.phrases : initialData.phrases,
      serviceTimes: cached.serviceTimes,
      loaded: true,
    };
    notify();
  } catch (error) {
    console.error('Unable to read cached public site settings:', error);
    try {
      window.sessionStorage.removeItem(CACHE_KEY);
    } catch (removeError) {
      console.error('Unable to clear invalid public site settings cache:', removeError);
    }
  }
}

function loadSiteSettings(): Promise<void> {
  loadCache();
  if (request) return request;

  request = window.fetch('/api/site-settings')
    .then(async response => {
      if (!response.ok) throw new Error(`Unable to load site settings (${response.status})`);
      const result: unknown = await response.json();
      if (
        typeof result !== 'object'
        || result === null
        || !('settings' in result)
        || !isStringRecord(result.settings)
      ) {
        throw new Error('The server returned invalid site settings.');
      }

      const phrases = 'phrases' in result && Array.isArray(result.phrases)
        ? result.phrases.filter((phrase): phrase is string => typeof phrase === 'string')
        : [];
      const serviceTimes = 'serviceTimes' in result && isServiceTimes(result.serviceTimes)
        ? result.serviceTimes
        : snapshot.serviceTimes;
      snapshot = {
        settings: { ...initialData.settings, ...result.settings },
        phrases: phrases.length ? phrases : initialData.phrases,
        serviceTimes,
        loaded: true,
      };
      saveCache(snapshot);
      notify();
    })
    .catch(error => {
      console.error('Failed to load church settings from CMS:', error);
      snapshot = { ...snapshot, loaded: true };
      notify();
    })
    .finally(() => {
      request = null;
    });

  return request;
}

export function updateSiteSettingsCache(updates: Record<string, string>): void {
  snapshot = {
    ...snapshot,
    settings: { ...snapshot.settings, ...updates },
    loaded: true,
  };
  saveCache(snapshot);
  notify();
}

export function useSiteSettings(): SiteSettingsData {
  const data = useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => initialData,
  );

  useEffect(() => {
    void loadSiteSettings();
  }, []);

  return data;
}
