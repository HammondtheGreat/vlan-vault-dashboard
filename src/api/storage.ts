// Backend-agnostic storage client
// Currently implemented with Supabase Storage. Phase 2 will swap to API file uploads.

import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);
  return { error: error ? { message: error.message } : null };
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, paths: string[]): Promise<void> {
  await supabase.storage.from(bucket).remove(paths);
}
