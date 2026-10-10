import { supabase } from '@/lib/supabase';

export async function compressImage(
  file: File,
  maxDimension = 1800,
  quality = 0.8
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    const ratio = width > height ? maxDimension / width : maxDimension / height;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      quality
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export async function uploadPhoto(
  householdId: string,
  itemId: string,
  photoId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  try {
    const compressed = await compressImage(file);
    const path = `${householdId}/${itemId}/${photoId}.jpg`;

    const { error } = await supabase.storage
      .from('item-photos')
      .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });

    if (error) return { path: '', error: error.message };
    return { path, error: null };
  } catch (err) {
    return { path: '', error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function uploadLocationPhoto(
  householdId: string,
  locationId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  try {
    const compressed = await compressImage(file, 1200, 0.7);
    const path = `${householdId}/locations/${locationId}.jpg`;

    const { error } = await supabase.storage
      .from('item-photos')
      .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });

    if (error) return { path: '', error: error.message };
    return { path, error: null };
  } catch (err) {
    return { path: '', error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function getPhotoUrlAsync(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('item-photos')
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
