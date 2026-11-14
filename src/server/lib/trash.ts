import { eq, sql } from 'drizzle-orm';

import { db } from '../db/supabase-client.js';
import {
  adminTrash,
  adminUsers,
  churchContacts,
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

export const TRASH_RECORD_TYPES = [
  'admin_users',
  'church_contacts',
  'contact_requests',
  'events',
  'gallery_images',
  'hero_phrases',
  'leadership_team',
  'ministries',
  'prayer_requests',
  'sermons',
  'service_times',
  'site_settings',
] as const;

export type TrashRecordType = (typeof TRASH_RECORD_TYPES)[number];

export function isTrashRecordType(value: string): value is TrashRecordType {
  return (TRASH_RECORD_TYPES as readonly string[]).includes(value);
}

function toDatabaseRecordKeys(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.replace(/[A-Z]/g, character => `_${character.toLowerCase()}`),
      value,
    ]),
  );
}

export async function moveRecordToTrash(
  recordType: TrashRecordType,
  id: number,
  deletedBy: number,
): Promise<boolean> {
  return db.transaction(async tx => {
    switch (recordType) {
      case 'admin_users': {
        const [row] = await tx.delete(adminUsers).where(eq(adminUsers.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'church_contacts': {
        const [row] = await tx.delete(churchContacts).where(eq(churchContacts.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'contact_requests': {
        const [row] = await tx.delete(contactRequests).where(eq(contactRequests.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'events': {
        const [row] = await tx.delete(events).where(eq(events.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'gallery_images': {
        const [row] = await tx.delete(galleryImages).where(eq(galleryImages.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'hero_phrases': {
        const [row] = await tx.delete(heroPhrases).where(eq(heroPhrases.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'leadership_team': {
        const [row] = await tx.delete(leadershipTeam).where(eq(leadershipTeam.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'ministries': {
        const [row] = await tx.delete(ministries).where(eq(ministries.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'prayer_requests': {
        const [row] = await tx.delete(prayerRequests).where(eq(prayerRequests.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'sermons': {
        const [row] = await tx.delete(sermons).where(eq(sermons.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'service_times': {
        const [row] = await tx.delete(serviceTimes).where(eq(serviceTimes.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
      case 'site_settings': {
        const [row] = await tx.delete(siteSettings).where(eq(siteSettings.id, id)).returning();
        if (!row) return false;
        await tx.insert(adminTrash).values({ recordType, recordId: String(id), recordData: row, deletedBy });
        return true;
      }
    }
  });
}

export async function restoreTrashRecord(id: number): Promise<TrashRecordType | null> {
  return db.transaction(async tx => {
    const [item] = await tx.select().from(adminTrash).where(eq(adminTrash.id, id)).limit(1);
    if (!item || !isTrashRecordType(item.recordType)) return null;

    const recordType = item.recordType;
    const tableNames: Record<TrashRecordType, string> = {
      admin_users: 'admin_users',
      church_contacts: 'church_contacts',
      contact_requests: 'contact_requests',
      events: 'events',
      gallery_images: 'gallery_images',
      hero_phrases: 'hero_phrases',
      leadership_team: 'leadership_team',
      ministries: 'ministries',
      prayer_requests: 'prayer_requests',
      sermons: 'sermons',
      service_times: 'service_times',
      site_settings: 'site_settings',
    };
    const tableName = tableNames[recordType];
    const table = sql.raw(`public."${tableName}"`);
    if (!item.recordData || typeof item.recordData !== 'object' || Array.isArray(item.recordData)) {
      throw new Error('The saved trash record is invalid.');
    }
    const serializedRecord = JSON.stringify(toDatabaseRecordKeys(item.recordData as Record<string, unknown>));
    if (!serializedRecord) throw new Error('The saved trash record is invalid.');
    await tx.execute(sql`
      INSERT INTO ${table}
      SELECT * FROM jsonb_populate_record(NULL::${table}, ${serializedRecord}::jsonb)
    `);
    await tx.execute(sql`
      SELECT setval(
        pg_get_serial_sequence(${`public.${tableName}`}, 'id'),
        GREATEST(
          COALESCE((SELECT MAX(id) FROM ${table}), 1),
          COALESCE((
            SELECT last_value FROM pg_sequences
            WHERE schemaname = 'public' AND sequencename = ${`${tableName}_id_seq`}
          ), 1)
        ),
        true
      )
    `);
    await tx.delete(adminTrash).where(eq(adminTrash.id, id));
    return recordType;
  });
}
