import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface AppSettings {
  id?: string;
  site_name: string;
  page_title: string;
  favicon_url: string | null;
}

const defaults: AppSettings = {
  site_name: "Warp9Net IPAM",
  page_title: "Warp9Net IPAM",
  favicon_url: null,
};

export function useAppSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["app_settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return defaults;
      return data as unknown as AppSettings;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings: Partial<AppSettings>) => {
      const existing = query.data;
      if (existing?.id) {
        const { error } = await supabase
          .from("app_settings" as any)
          .update({ ...settings, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings" as any)
          .insert({ ...settings, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Settings saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { settings: query.data ?? defaults, isLoading: query.isLoading, save: mutation.mutateAsync };
}

export interface SmtpSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
}

const smtpDefaults: SmtpSettings = {
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  from_email: "",
  from_name: "",
  use_tls: true,
};

export function useSmtpSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["smtp_settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smtp_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return smtpDefaults;
      return data as unknown as SmtpSettings;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings: Partial<SmtpSettings>) => {
      const existing = query.data;
      if (existing?.id) {
        const { error } = await supabase
          .from("smtp_settings" as any)
          .update({ ...settings, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("smtp_settings" as any)
          .insert({ ...settings, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp_settings"] });
      toast.success("SMTP settings saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { settings: query.data ?? smtpDefaults, isLoading: query.isLoading, save: mutation.mutateAsync };
}
