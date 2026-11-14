import type { Request, Response } from 'express';
import { eq, notInArray } from 'drizzle-orm';

import { adminTrash, churchContacts, siteSettings } from '../../../db/schema.js';
import { db } from '../../../db/supabase-client.js';
import { requireAdmin } from '../auth.js';

interface ContactInput {
  id?: number;
  kind: 'phone' | 'email' | 'address' | 'website' | 'whatsapp' | 'other';
  label: string;
  value: string;
  sortOrder?: number;
  active?: boolean;
  primary?: boolean;
}

export default async function handler(req: Request, res: Response) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const contacts = req.body as ContactInput[];
  if (!Array.isArray(contacts) || contacts.some(contact =>
    !contact
    || !['phone', 'email', 'address', 'website', 'whatsapp', 'other'].includes(contact.kind)
    || typeof contact.label !== 'string'
    || typeof contact.value !== 'string'
    || !contact.label.trim()
    || !contact.value.trim()
    || (contact.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value.trim()))
  )) {
    return res.status(400).json({ error: 'Contacts must include a supported type, label, and value' });
  }

  const ids = contacts.filter(contact => Number.isSafeInteger(contact.id) && Number(contact.id) > 0)
    .map(contact => Number(contact.id));
  if (new Set(ids).size !== ids.length) {
    return res.status(400).json({ error: 'Contact ids must be unique' });
  }

  try {
    await db.transaction(async tx => {
      const removed = ids.length > 0
        ? await tx.delete(churchContacts).where(notInArray(churchContacts.id, ids)).returning()
        : await tx.delete(churchContacts).returning();
      if (removed.length > 0) {
        await tx.insert(adminTrash).values(removed.map(row => ({
          recordType: 'church_contacts',
          recordId: String(row.id),
          recordData: row,
          deletedBy: admin.id,
        })));
      }

      const primaryKinds = new Set<string>();
      for (const contact of contacts) {
        const isPrimary = contact.primary === true && !primaryKinds.has(contact.kind);
        if (isPrimary) primaryKinds.add(contact.kind);
        const values = {
          kind: contact.kind,
          label: contact.label.trim(),
          value: contact.value.trim(),
          sortOrder: contact.sortOrder ?? 0,
          active: contact.active !== false,
          primary: isPrimary,
          updatedAt: new Date(),
        };
        if (contact.id && ids.includes(contact.id)) {
          await tx.update(churchContacts).set(values).where(eq(churchContacts.id, contact.id));
        } else {
          await tx.insert(churchContacts).values(values);
        }
      }

      for (const kind of ['phone', 'email', 'address'] as const) {
        const primary = contacts.find(contact => contact.kind === kind && contact.active !== false && contact.primary);
        const firstActive = contacts.find(contact => contact.kind === kind && contact.active !== false);
        const settingKey = kind;
        const value = (primary || firstActive)?.value.trim() || '';
        await tx.insert(siteSettings)
          .values({ key: settingKey, value })
          .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
      }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to save church contacts:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to save church contacts' });
  }
}
