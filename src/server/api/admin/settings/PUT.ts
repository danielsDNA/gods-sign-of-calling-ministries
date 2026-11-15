import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/supabase-client.js';
import { siteSettings } from '../../../db/schema.js';
import { requireAdmin } from '../auth.js';
import type { AdminPermission } from '../../../../lib/admin-permissions.js';
import { parseHttpsMediaUrl } from '../../../../lib/media-urls.js';
import { sanitizeRichTextHtml } from '../../../../lib/content-text.js';

const editorSettingKeys = new Set([
  'church_name',
  'tagline',
  'map_address',
  'map_embed_url',
  'logo_url',
  'about_image_url',
  'stay_connected_enabled',
  'facebook_url',
  'instagram_url',
  'youtube_url',
  'twitter_url',
]);

const giveDetailKeys = new Set([
  'give_mtn_code',
  'give_mtn_number',
  'give_mtn_name',
  'give_airtel_code',
  'give_airtel_number',
  'give_airtel_name',
  'give_bank_name',
  'give_bank_account_name',
  'give_bank_account_number',
  'give_bank_branch',
  'give_campaign_title',
  'give_reason',
  'give_payment_instructions',
  'give_image_url',
]);

const ownerOnlyGiveKeys = new Set([
  'give_enabled',
  'give_popup_enabled',
  'event_popup_enabled',
  'give_editor_details_enabled',
  'give_mtn_enabled',
  'give_airtel_enabled',
  'give_bank_enabled',
  'whatsapp_float_enabled',
  'whatsapp_float_position',
  'whatsapp_number',
]);

function requiredPermissionForSetting(key: string): AdminPermission | null {
  if (giveDetailKeys.has(key)) return 'site-info';
  if (ownerOnlyGiveKeys.has(key)) return null;
  if (['facebook_url', 'instagram_url', 'youtube_url', 'twitter_url', 'stay_connected_enabled'].includes(key)) return 'social';
  if (key === 'home_animated_gallery_ids') return 'gallery';
  if (['hero_bg_url', 'about_bg_url'].includes(key)) return 'media';
  if (key.startsWith('hero_')) return 'hero';
  return editorSettingKeys.has(key) ? 'site-info' : null;
}

export default async function handler(req: Request, res: Response) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const updates = req.body as Record<string, string>;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ error: 'Body must be a key/value object' });
    }
    const giveEditorsSetting = await db.select({ value: siteSettings.value }).from(siteSettings)
      .where(eq(siteSettings.key, 'give_editor_details_enabled')).limit(1);
    const editorsCanManageGiveDetails = giveEditorsSetting[0]?.value === 'true';
    const invalidKey = Object.keys(updates).find(key => {
      if (typeof updates[key] !== 'string') return true;
      if (admin.role === 'owner') return false;
      if (ownerOnlyGiveKeys.has(key)) return true;
      if (giveDetailKeys.has(key) && !editorsCanManageGiveDetails) return true;
      if (key === 'logo_url') return !admin.permissions.some(permission => ['site-info', 'media'].includes(permission));
      const requiredPermission = requiredPermissionForSetting(key);
      return !requiredPermission || !admin.permissions.includes(requiredPermission);
    });
    if (invalidKey) {
      return res.status(403).json({ error: `You do not have permission to change "${invalidKey}"` });
    }

    if (
      typeof updates.give_campaign_title === 'string'
      && updates.give_campaign_title.length > 120
    ) {
      return res.status(400).json({ error: 'Fundraising heading must be 120 characters or fewer.' });
    }
    if (typeof updates.give_reason === 'string' && updates.give_reason.length > 2000) {
      return res.status(400).json({ error: 'Fundraising description must be 2,000 characters or fewer.' });
    }
    if (typeof updates.give_payment_instructions === 'string' && updates.give_payment_instructions.length > 5000) {
      return res.status(400).json({ error: 'Payment instructions must be 5,000 characters or fewer.' });
    }
    if (
      typeof updates.whatsapp_float_position === 'string'
      && !['left', 'right'].includes(updates.whatsapp_float_position)
    ) {
      return res.status(400).json({ error: 'WhatsApp button position must be left or right.' });
    }
    if (typeof updates.give_image_url === 'string' && updates.give_image_url) {
      const imageUrl = updates.give_image_url;
      const safeLocalImage = imageUrl.startsWith('/') && !imageUrl.startsWith('//');
      const safeHttpsImage = parseHttpsMediaUrl(imageUrl) !== null;
      if (!safeLocalImage && !safeHttpsImage) {
        return res.status(400).json({ error: 'Fundraising image must use a local path or HTTPS URL.' });
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      const safeValue = ['give_reason', 'give_payment_instructions'].includes(key)
        ? sanitizeRichTextHtml(value)
        : value;
      await db
        .insert(siteSettings)
        .values({ key, value: safeValue })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: safeValue },
        });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Unable to save site settings:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to save settings' });
  }
}
