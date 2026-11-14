import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

import { requireAdmin } from '../auth.js';

const bucketName = 'church-media';

const mediaTypes: Record<string, { extension: string; maxSize: number }> = {
  'image/jpeg': { extension: '.jpg', maxSize: 10 * 1024 * 1024 },
  'image/jpg': { extension: '.jpg', maxSize: 10 * 1024 * 1024 },
  'image/png': { extension: '.png', maxSize: 10 * 1024 * 1024 },
  'image/webp': { extension: '.webp', maxSize: 10 * 1024 * 1024 },
  'image/gif': { extension: '.gif', maxSize: 10 * 1024 * 1024 },
  'video/mp4': { extension: '.mp4', maxSize: 50 * 1024 * 1024 },
  'video/webm': { extension: '.webm', maxSize: 50 * 1024 * 1024 },
  'video/ogg': { extension: '.ogv', maxSize: 50 * 1024 * 1024 },
  'audio/mpeg': { extension: '.mp3', maxSize: 50 * 1024 * 1024 },
  'audio/mp4': { extension: '.m4a', maxSize: 50 * 1024 * 1024 },
  'audio/wav': { extension: '.wav', maxSize: 50 * 1024 * 1024 },
  'audio/x-wav': { extension: '.wav', maxSize: 50 * 1024 * 1024 },
  'audio/ogg': { extension: '.ogg', maxSize: 50 * 1024 * 1024 },
  'audio/webm': { extension: '.weba', maxSize: 50 * 1024 * 1024 },
};

export default async function handler(req: Request, res: Response) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { contentType, fileSize } = req.body as {
    contentType?: unknown;
    fileSize?: unknown;
  };
  if (typeof contentType !== 'string' || typeof fileSize !== 'number' || !Number.isInteger(fileSize)) {
    return res.status(400).json({ error: 'A valid content type and file size are required' });
  }

  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase();
  const media = mediaTypes[mediaType];
  if (!media) {
    return res.status(400).json({ error: 'Only JPEG, PNG, WebP, GIF, MP4, WebM, Ogg, MP3, M4A, and WAV files are allowed' });
  }
  if (fileSize <= 0 || fileSize > media.maxSize) {
    return res.status(400).json({ error: `File too large or empty (max ${media.maxSize / (1024 * 1024)}MB)` });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase Storage is not configured');
    return res.status(503).json({ error: 'Uploads are not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${media.extension}`;
    const path = `uploads/church/${filename}`;
    const { data, error } = await supabase.storage.from(bucketName).createSignedUploadUrl(path);
    if (error) {
      console.error('Supabase signed upload URL creation failed:', error.message);
      return res.status(502).json({ error: 'Unable to prepare the upload' });
    }

    const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(path);
    res.json({
      path: data.path,
      token: data.token,
      publicUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    console.error('Supabase signed upload URL creation failed:', error);
    res.status(500).json({ error: 'Unable to prepare the upload' });
  }
}
