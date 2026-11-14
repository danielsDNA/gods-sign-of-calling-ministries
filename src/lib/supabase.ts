import type { SupabaseClient } from '@supabase/supabase-js';

const bucketName = 'church-media';
let client: SupabaseClient | undefined;
type UploadFile = Extract<Parameters<
  ReturnType<SupabaseClient['storage']['from']>['uploadToSignedUrl']
>[2], { webkitRelativePath: string }>;

async function optimizeImage(file: UploadFile): Promise<UploadFile> {
  if (
    !file.type.startsWith('image/')
    || file.type === 'image/gif'
    || file.size < 1024 * 1024
    || typeof globalThis.createImageBitmap !== 'function'
  ) {
    return file;
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await globalThis.createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const optimized = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/webp', 0.82);
    });
    if (!optimized || optimized.size >= file.size) return file;

    return new File([optimized], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn('Image optimization failed; uploading the original image instead.', error);
    return file;
  } finally {
    bitmap?.close();
  }
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing browser Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Production and redeploy, or set them in the local .env file.');
  }

  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

interface SignedUpload {
  path: string;
  token: string;
  publicUrl: string;
}

export async function uploadChurchMedia(file: UploadFile): Promise<string> {
  const uploadFile = await optimizeImage(file);
  const response = await globalThis.fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: uploadFile.type, fileSize: uploadFile.size }),
  });
  const result = (await response.json()) as SignedUpload | { error?: string };
  if (!response.ok || !('path' in result) || !('token' in result) || !('publicUrl' in result)) {
    throw new Error('error' in result && result.error ? result.error : 'Unable to prepare the upload');
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .storage
    .from(bucketName)
    .uploadToSignedUrl(result.path, result.token, uploadFile, { contentType: uploadFile.type });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return result.publicUrl;
}
