/*
 * useSiteSettings — fetches live site settings and hero phrases from the database.
 * Falls back to churchConfig values if the API is unavailable.
 */

import { useState, useEffect } from 'react';
import { churchConfig } from '@/config/church';

export interface SiteSettingsData {
  settings: Record<string, string>;
  phrases: string[];
  serviceTimes: Array<{ id?: number; day: string; time: string; label: string; location: string }>;
  loaded: boolean;
}

const FALLBACK_PHRASES = [
  'Rooted in Psalm 27',
  'Serving Our Communities',
  'Growing Together in Faith',
  'Proclaiming the Good News',
  'A Place to Belong',
];

export function useSiteSettings(): SiteSettingsData {
  const [data, setData] = useState<SiteSettingsData>({
    settings: {
      church_name: churchConfig.name,
      hero_welcome: "God's Sign of Calling Revival Ministries",
      hero_headline: churchConfig.hero.heading,
      hero_subheading: churchConfig.hero.subheading,
      hero_cta_primary_label: churchConfig.hero.ctaPrimary.label,
      hero_cta_primary_href: churchConfig.hero.ctaPrimary.href,
      hero_cta_secondary_label: churchConfig.hero.ctaSecondary.label,
      hero_cta_secondary_href: churchConfig.hero.ctaSecondary.href,
      hero_photo_url: '/airo-assets/images/pages/home/about-community',
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
    },
    phrases: FALLBACK_PHRASES,
    serviceTimes: churchConfig.serviceTimes,
    loaded: false,
  });

  useEffect(() => {
    let active = true;
    const settingsRequest = globalThis.fetch('/api/site-settings', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error(`Unable to load site settings (${response.status})`);
      return response.json() as Promise<unknown>;
    });
    const serviceTimesRequest = globalThis.fetch('/api/service-times', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error(`Unable to load service times (${response.status})`);
      return response.json() as Promise<unknown>;
    });

    Promise.allSettled([settingsRequest, serviceTimesRequest]).then(([settingsResult, serviceTimesResult]) => {
      if (!active) return;

      let updatedSettings: Record<string, string> | null = null;
      let updatedPhrases: string[] | null = null;
      if (settingsResult.status === 'fulfilled') {
        const result = settingsResult.value;
        if (typeof result === 'object' && result !== null && 'settings' in result
          && typeof result.settings === 'object' && result.settings !== null && !Array.isArray(result.settings)) {
          updatedSettings = result.settings as Record<string, string>;
          updatedPhrases = 'phrases' in result && Array.isArray(result.phrases)
            ? result.phrases.filter((phrase): phrase is string => typeof phrase === 'string')
            : null;
        } else {
          console.error('Failed to load church settings from CMS:', new Error('Invalid site-settings response'));
        }
      } else {
        console.error('Failed to load church settings from CMS:', settingsResult.reason);
      }

      let updatedServiceTimes: SiteSettingsData['serviceTimes'] | null = null;
      if (serviceTimesResult.status === 'fulfilled' && Array.isArray(serviceTimesResult.value)) {
        updatedServiceTimes = serviceTimesResult.value as SiteSettingsData['serviceTimes'];
      } else if (serviceTimesResult.status === 'rejected') {
        console.error('Failed to load service times from CMS:', serviceTimesResult.reason);
      } else {
        console.error('Failed to load service times from CMS:', new Error('Invalid service-times response'));
      }

      setData(previous => ({
        ...previous,
        settings: updatedSettings ? { ...previous.settings, ...updatedSettings } : previous.settings,
        phrases: updatedPhrases?.length ? updatedPhrases : previous.phrases,
        serviceTimes: updatedServiceTimes ?? previous.serviceTimes,
        loaded: true,
      }));
    });

    return () => {
      active = false;
    };
  }, []);

  return data;
}
