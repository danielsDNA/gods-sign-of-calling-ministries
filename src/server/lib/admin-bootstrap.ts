import { asc, desc, eq } from 'drizzle-orm';

import { db } from '../db/supabase-client.js';
import type { AdminPermission } from '../../lib/admin-permissions.js';
import {
  adminUsers,
  contactRequests,
  events,
  galleryImages,
  heroPhrases,
  leadershipTeam,
  ministries,
  prayerRequests,
  sermons,
  serviceTimes,
  siteSettings,
} from '../db/schema.js';

export async function loadAdminBootstrap(role: string, permissions: AdminPermission[]) {
  const can = (permission: AdminPermission) => role === 'owner' || permissions.includes(permission);
  const [
    settingsRows,
    phrases,
    sermonsList,
    eventsList,
    prayerList,
    contactRequestList,
    ministryList,
    leaders,
    times,
    gallery,
    accounts,
  ] = await Promise.all([
    db.select().from(siteSettings),
    can('phrases') ? db.select().from(heroPhrases)
      .where(eq(heroPhrases.active, true))
      .orderBy(asc(heroPhrases.sortOrder)) : Promise.resolve([]),
    can('sermons') ? db.select().from(sermons).orderBy(desc(sermons.createdAt)) : Promise.resolve([]),
    can('events') ? db.select().from(events).orderBy(desc(events.startsAt)) : Promise.resolve([]),
    can('requests') ? db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt)) : Promise.resolve([]),
    can('requests') ? db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt)) : Promise.resolve([]),
    can('ministries') ? db.select().from(ministries).orderBy(asc(ministries.sortOrder)) : Promise.resolve([]),
    can('leadership') ? db.select().from(leadershipTeam).orderBy(asc(leadershipTeam.sortOrder)) : Promise.resolve([]),
    can('service-times') ? db.select().from(serviceTimes).orderBy(asc(serviceTimes.sortOrder)) : Promise.resolve([]),
    can('gallery') ? db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder)) : Promise.resolve([]),
    role === 'owner'
      ? db.select({
          id: adminUsers.id,
          email: adminUsers.email,
          displayName: adminUsers.displayName,
          role: adminUsers.role,
          permissions: adminUsers.permissions,
          createdAt: adminUsers.createdAt,
        }).from(adminUsers).orderBy(asc(adminUsers.email))
      : Promise.resolve([]),
  ]);
  const editorsCanManageGiveDetails = settingsRows.some(setting =>
    setting.key === 'give_editor_details_enabled' && setting.value === 'true'
  );

  const settings: Record<string, string> = {};
  for (const setting of settingsRows) {
    const allowed = role === 'owner'
      || (can('social') && [
        'facebook_url', 'instagram_url', 'youtube_url', 'twitter_url', 'stay_connected_enabled',
      ].includes(setting.key))
      || (can('site-info') && [
        'church_name', 'tagline', 'map_address', 'map_embed_url', 'logo_url',
        'about_image_url',
      ].includes(setting.key))
      || (can('site-info') && editorsCanManageGiveDetails && [
        'give_mtn_number', 'give_mtn_name', 'give_airtel_number', 'give_airtel_name',
        'give_mtn_code', 'give_airtel_code',
        'give_bank_name', 'give_bank_account_name', 'give_bank_account_number', 'give_bank_branch',
      ].includes(setting.key))
      || (can('site-info') && [
        'give_editor_details_enabled', 'give_mtn_enabled', 'give_airtel_enabled', 'give_bank_enabled',
      ].includes(setting.key))
      || (can('media') && ['logo_url', 'hero_bg_url', 'about_bg_url'].includes(setting.key))
      || (can('gallery') && setting.key === 'home_animated_gallery_ids')
      || (can('hero') && setting.key.startsWith('hero_'));
    if (allowed) settings[setting.key] = setting.value ?? '';
  }

  return {
    settings,
    phrases: phrases.map(phrase => phrase.phrase),
    sermons: sermonsList,
    events: eventsList,
    prayers: prayerList,
    contactRequests: contactRequestList,
    ministries: ministryList,
    leaders,
    serviceTimes: times,
    gallery,
    adminAccounts: accounts,
  };
}
