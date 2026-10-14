import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

export async function uploadToSupabaseBucket(bucketName: string, filePath: string, fileBuffer: Buffer, contentType: string) {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.warn(`[Supabase] Upload warning: ${error.message}. Returning local media URI.`);
      return `/media/${filePath}`;
    }
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.warn(`[Supabase] Upload exception: ${error.message}`);
    return `/media/${filePath}`;
  }
}
