import { useState, useEffect, useCallback } from "react";
import * as api from "@/api/client";
import * as storage from "@/api/storage";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ display_name: null, avatar_url: null });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await api.getProfile(user.id);
    if (data) setProfile(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    await storage.deleteFile("avatars", [filePath]);

    const { error: uploadError } = await storage.uploadFile("avatars", filePath, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const publicUrl = storage.getPublicUrl("avatars", filePath);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    await api.updateProfile(user.id, { avatar_url: avatarUrl } as any);
    setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
    return avatarUrl;
  };

  return { profile, loading, fetchProfile, updateAvatar };
}
