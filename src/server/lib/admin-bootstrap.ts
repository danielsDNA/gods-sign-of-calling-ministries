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
  const settingsRows = await db.select().from(siteSettings);
  const editorsCanManageGiveDetails = settingsRows.some(setting =>
    setting.key === 'give_editor_details_enabled' && setting.value === 'true'
  );
  const phrases = can('phrases') ? await db.select().from(heroPhrases)
    .where(eq(heroPhrases.active, true))
    .orderBy(asc(heroPhrases.sortOrder)) : [];
  const sermonsList = can('sermons') ? await db.select().from(sermons).orderBy(desc(sermons.createdAt)) : [];
  const eventsList = can('events') ? await db.select().from(events).orderBy(desc(events.startsAt)) : [];
  const prayerList = can('requests') ? await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt)) : [];
  const contactRequestList = can('requests') ? await db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt)) : [];
  const ministryList = can('ministries') ? await db.select().from(ministries).orderBy(asc(ministries.sortOrder)) : [];
  const leaders = can('leadership') ? await db.select().from(leadershipTeam).orderBy(asc(leadershipTeam.sortOrder)) : [];
  const times = can('service-times') ? await db.select().from(serviceTimes).orderBy(asc(serviceTimes.sortOrder)) : [];
  const gallery = can('gallery') ? await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder)) : [];
  const accounts = role === 'owner'
    ? await db.select({
        id: adminUsers.id,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        permissions: adminUsers.permissions,
        createdAt: adminUsers.createdAt,
      }).from(adminUsers).orderBy(asc(adminUsers.email))
    : [];

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
