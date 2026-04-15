// Backend-agnostic API client
// Currently implemented with Supabase. Phase 2 will swap to a standard REST API.

import { supabase } from "@/integrations/supabase/client";
import type {
  VlanRow, VlanInsert, VlanUpdate,
  DeviceRow, DeviceInsert, DeviceUpdate,
  RackItemRow, RackItemInsert, RackItemUpdate,
  CableDropRow, CableDropInsert, CableDropUpdate,
  PduOutletRow, PduOutletInsert, PduOutletUpdate,
  WirelessNetworkRow, WirelessNetworkInsert, WirelessNetworkUpdate,
  AppSettingsRow, SmtpSettingsRow, ProfileRow,
  AuditLogRow, AuditLogInsert,
  ApiResult,
} from "./types";

// ── Helper ───────────────────────────────────────────────────
function result<T>(data: T | null, error: any): ApiResult<T> {
  return { data, error: error ? { message: error.message || String(error) } : null };
}

// ── VLANs ────────────────────────────────────────────────────
export async function getVlans(): Promise<ApiResult<VlanRow[]>> {
  const { data, error } = await supabase.from("vlans" as any).select("*").order("vlan_id");
  return result(data as any, error);
}

export async function createVlan(row: VlanInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("vlans" as any).insert(row as any);
  return result(null, error);
}

export async function updateVlan(vlanId: number, updates: VlanUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("vlans" as any).update(updates as any).eq("vlan_id", vlanId);
  return result(null, error);
}

export async function deleteVlan(vlanId: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from("vlans" as any).delete().eq("vlan_id", vlanId);
  return result(null, error);
}

// ── Devices ──────────────────────────────────────────────────
export async function getDevices(): Promise<ApiResult<DeviceRow[]>> {
  const { data, error } = await supabase.from("devices" as any).select("*").order("ip_address");
  return result(data as any, error);
}

export async function getDevicesByName(): Promise<ApiResult<DeviceRow[]>> {
  const { data, error } = await supabase.from("devices").select("*").order("device_name");
  return result(data as DeviceRow[] | null, error);
}

export async function createDevice(row: DeviceInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).insert(row as any);
  return result(null, error);
}

export async function updateDevice(id: string, updates: DeviceUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).update(updates as any).eq("id", id);
  return result(null, error);
}

export async function deleteDevice(id: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).delete().eq("id", id);
  return result(null, error);
}

export async function updateDevicesByVlan(vlanId: number, updates: Partial<DeviceUpdate>): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).update(updates as any).eq("vlan_id", vlanId);
  return result(null, error);
}

export async function deleteAllDevices(): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return result(null, error);
}

export async function deleteAllVlans(): Promise<ApiResult<null>> {
  const { error } = await supabase.from("vlans" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return result(null, error);
}

export async function bulkInsertVlans(rows: VlanInsert[]): Promise<ApiResult<null>> {
  const { error } = await supabase.from("vlans" as any).insert(rows as any);
  return result(null, error);
}

export async function bulkInsertDevices(rows: DeviceInsert[]): Promise<ApiResult<null>> {
  const { error } = await supabase.from("devices" as any).insert(rows as any);
  return result(null, error);
}

// ── Rack Items ───────────────────────────────────────────────
export async function getRackItems(): Promise<ApiResult<RackItemRow[]>> {
  const { data, error } = await supabase.from("rack_items" as any).select("*").order("start_u");
  return result(data as any, error);
}

export async function createRackItem(row: RackItemInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("rack_items" as any).insert(row as any);
  return result(null, error);
}

export async function updateRackItem(id: string, updates: RackItemUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("rack_items" as any).update(updates as any).eq("id", id);
  return result(null, error);
}

export async function deleteRackItem(id: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("rack_items" as any).delete().eq("id", id);
  return result(null, error);
}

// ── Cable Drops ──────────────────────────────────────────────
export async function getCableDrops(): Promise<ApiResult<CableDropRow[]>> {
  const { data, error } = await supabase.from("cable_drops" as any).select("*").order("sort_order");
  return result(data as any, error);
}

export async function createCableDrop(row: CableDropInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("cable_drops" as any).insert(row as any);
  return result(null, error);
}

export async function updateCableDrop(id: string, updates: CableDropUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("cable_drops" as any).update(updates as any).eq("id", id);
  return result(null, error);
}

export async function deleteCableDrop(id: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("cable_drops" as any).delete().eq("id", id);
  return result(null, error);
}

// ── PDU Outlets ──────────────────────────────────────────────
export async function getPduOutlets(): Promise<ApiResult<PduOutletRow[]>> {
  const { data, error } = await supabase.from("pdu_outlets" as any).select("*").order("outlet_number");
  return result(data as any, error);
}

export async function createPduOutlet(row: PduOutletInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("pdu_outlets" as any).insert(row as any);
  return result(null, error);
}

export async function updatePduOutlet(id: string, updates: PduOutletUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("pdu_outlets" as any).update(updates as any).eq("id", id);
  return result(null, error);
}

export async function deletePduOutlet(id: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("pdu_outlets" as any).delete().eq("id", id);
  return result(null, error);
}

// ── Wireless Networks ────────────────────────────────────────
export async function getWirelessNetworks(): Promise<ApiResult<WirelessNetworkRow[]>> {
  const { data, error } = await supabase.from("wireless_networks" as any).select("*").order("sort_order");
  return result(data as any, error);
}

export async function createWirelessNetwork(row: WirelessNetworkInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("wireless_networks" as any).insert(row as any);
  return result(null, error);
}

export async function updateWirelessNetwork(id: string, updates: WirelessNetworkUpdate): Promise<ApiResult<null>> {
  const { error } = await supabase.from("wireless_networks" as any).update(updates as any).eq("id", id);
  return result(null, error);
}

export async function deleteWirelessNetwork(id: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("wireless_networks" as any).delete().eq("id", id);
  return result(null, error);
}

// ── App Settings ─────────────────────────────────────────────
export async function getAppSettings(userId: string): Promise<ApiResult<AppSettingsRow | null>> {
  const { data, error } = await supabase
    .from("app_settings" as any)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return result(data as any, error);
}

export async function updateAppSettings(id: string, updates: Partial<AppSettingsRow>): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("app_settings" as any)
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", id);
  return result(null, error);
}

export async function insertAppSettings(settings: Partial<AppSettingsRow> & { user_id: string }): Promise<ApiResult<null>> {
  const { error } = await supabase.from("app_settings" as any).insert(settings as any);
  return result(null, error);
}

// ── SMTP Settings ────────────────────────────────────────────
export async function getSmtpSettings(userId: string): Promise<ApiResult<SmtpSettingsRow | null>> {
  const { data, error } = await supabase
    .from("smtp_settings" as any)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return result(data as any, error);
}

export async function updateSmtpSettings(id: string, updates: Partial<SmtpSettingsRow>): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("smtp_settings" as any)
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", id);
  return result(null, error);
}

export async function insertSmtpSettings(settings: Partial<SmtpSettingsRow> & { user_id: string }): Promise<ApiResult<null>> {
  const { error } = await supabase.from("smtp_settings" as any).insert(settings as any);
  return result(null, error);
}

// ── Profiles ─────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<ApiResult<ProfileRow | null>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  return result(data as any, error);
}

export async function updateProfile(userId: string, updates: Partial<ProfileRow>): Promise<ApiResult<null>> {
  const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
  return result(null, error);
}

// ── Audit Log ────────────────────────────────────────────────
export async function getAuditLog(limit = 50): Promise<ApiResult<AuditLogRow[]>> {
  const { data, error } = await supabase
    .from("audit_log" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return result(data as any, error);
}

export async function createAuditEntry(entry: AuditLogInsert): Promise<ApiResult<null>> {
  const { error } = await supabase.from("audit_log" as any).insert(entry as any);
  return result(null, error);
}

// ── Edge Functions ───────────────────────────────────────────
export async function invokeFunction(name: string, body: any): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  return { data, error };
}
