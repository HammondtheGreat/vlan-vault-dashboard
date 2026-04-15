// Backend-agnostic storage client — REST implementation

const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  _options?: { upsert?: boolean }
): Promise<{ error: { message: string } | null }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(`${BASE}/storage/${bucket}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: { message: body.error || "Upload failed" } };
    }
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  return `/uploads/${bucket}/${path}`;
}

export async function deleteFile(bucket: string, paths: string[]): Promise<void> {
  const token = getToken();
  for (const p of paths) {
    const filename = p.split("/").pop();
    await fetch(`${BASE}/storage/${bucket}/${filename}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
