// Backend-agnostic API client — REST implementation
// Talks to the Express API server via fetch

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

// ── Base URL ─────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      return { data: null, error: { message: body.error || res.statusText } };
    }
    const data = await res.json().catch(() => null);
    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || String(err) } };
  }
}

// ── VLANs ────────────────────────────────────────────────────
export async function getVlans(): Promise<ApiResult<VlanRow[]>> {
  return api<VlanRow[]>("/vlans");
}

export async function createVlan(row: VlanInsert): Promise<ApiResult<null>> {
  return api("/vlans", { method: "POST", body: JSON.stringify(row) });
}

export async function updateVlan(vlanId: number, updates: VlanUpdate): Promise<ApiResult<null>> {
  return api(`/vlans/${vlanId}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteVlan(vlanId: number): Promise<ApiResult<null>> {
  return api(`/vlans/${vlanId}`, { method: "DELETE" });
}

// ── Devices ──────────────────────────────────────────────────
export async function getDevices(): Promise<ApiResult<DeviceRow[]>> {
  return api<DeviceRow[]>("/devices");
}

export async function getDevicesByName(): Promise<ApiResult<DeviceRow[]>> {
  return api<DeviceRow[]>("/devices?order=name");
}

export async function createDevice(row: DeviceInsert): Promise<ApiResult<null>> {
  return api("/devices", { method: "POST", body: JSON.stringify(row) });
}

export async function updateDevice(id: string, updates: DeviceUpdate): Promise<ApiResult<null>> {
  return api(`/devices/${id}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteDevice(id: string): Promise<ApiResult<null>> {
  return api(`/devices/${id}`, { method: "DELETE" });
}

export async function updateDevicesByVlan(vlanId: number, updates: Partial<DeviceUpdate>): Promise<ApiResult<null>> {
  return api(`/devices/by-vlan/${vlanId}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteAllDevices(): Promise<ApiResult<null>> {
  return api("/devices", { method: "DELETE" });
}

export async function deleteAllVlans(): Promise<ApiResult<null>> {
  return api("/vlans", { method: "DELETE" });
}

export async function bulkInsertVlans(rows: VlanInsert[]): Promise<ApiResult<null>> {
  return api("/vlans/bulk", { method: "POST", body: JSON.stringify(rows) });
}

export async function bulkInsertDevices(rows: DeviceInsert[]): Promise<ApiResult<null>> {
  return api("/devices/bulk", { method: "POST", body: JSON.stringify(rows) });
}

// ── Rack Items ───────────────────────────────────────────────
export async function getRackItems(): Promise<ApiResult<RackItemRow[]>> {
  return api<RackItemRow[]>("/rack-items");
}

export async function createRackItem(row: RackItemInsert): Promise<ApiResult<null>> {
  return api("/rack-items", { method: "POST", body: JSON.stringify(row) });
}

export async function updateRackItem(id: string, updates: RackItemUpdate): Promise<ApiResult<null>> {
  return api(`/rack-items/${id}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteRackItem(id: string): Promise<ApiResult<null>> {
  return api(`/rack-items/${id}`, { method: "DELETE" });
}

// ── Cable Drops ──────────────────────────────────────────────
export async function getCableDrops(): Promise<ApiResult<CableDropRow[]>> {
  return api<CableDropRow[]>("/cable-drops");
}

export async function createCableDrop(row: CableDropInsert): Promise<ApiResult<null>> {
  return api("/cable-drops", { method: "POST", body: JSON.stringify(row) });
}

export async function updateCableDrop(id: string, updates: CableDropUpdate): Promise<ApiResult<null>> {
  return api(`/cable-drops/${id}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteCableDrop(id: string): Promise<ApiResult<null>> {
  return api(`/cable-drops/${id}`, { method: "DELETE" });
}

// ── PDU Outlets ──────────────────────────────────────────────
export async function getPduOutlets(): Promise<ApiResult<PduOutletRow[]>> {
  return api<PduOutletRow[]>("/pdu-outlets");
}

export async function createPduOutlet(row: PduOutletInsert): Promise<ApiResult<null>> {
  return api("/pdu-outlets", { method: "POST", body: JSON.stringify(row) });
}

export async function updatePduOutlet(id: string, updates: PduOutletUpdate): Promise<ApiResult<null>> {
  return api(`/pdu-outlets/${id}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deletePduOutlet(id: string): Promise<ApiResult<null>> {
  return api(`/pdu-outlets/${id}`, { method: "DELETE" });
}

// ── Wireless Networks ────────────────────────────────────────
export async function getWirelessNetworks(): Promise<ApiResult<WirelessNetworkRow[]>> {
  return api<WirelessNetworkRow[]>("/wireless-networks");
}

export async function createWirelessNetwork(row: WirelessNetworkInsert): Promise<ApiResult<null>> {
  return api("/wireless-networks", { method: "POST", body: JSON.stringify(row) });
}

export async function updateWirelessNetwork(id: string, updates: WirelessNetworkUpdate): Promise<ApiResult<null>> {
  return api(`/wireless-networks/${id}`, { method: "PUT", body: JSON.stringify(updates) });
}

export async function deleteWirelessNetwork(id: string): Promise<ApiResult<null>> {
  return api(`/wireless-networks/${id}`, { method: "DELETE" });
}

// ── App Settings ─────────────────────────────────────────────
export async function getAppSettings(_userId: string): Promise<ApiResult<AppSettingsRow | null>> {
  return api<AppSettingsRow | null>("/settings/app");
}

export async function updateAppSettings(id: string, updates: Partial<AppSettingsRow>): Promise<ApiResult<null>> {
  return api("/settings/app", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
}

export async function insertAppSettings(settings: Partial<AppSettingsRow> & { user_id: string }): Promise<ApiResult<null>> {
  return api("/settings/app", { method: "PUT", body: JSON.stringify(settings) });
}

// ── SMTP Settings ────────────────────────────────────────────
export async function getSmtpSettings(_userId: string): Promise<ApiResult<SmtpSettingsRow | null>> {
  return api<SmtpSettingsRow | null>("/settings/smtp");
}

export async function updateSmtpSettings(id: string, updates: Partial<SmtpSettingsRow>): Promise<ApiResult<null>> {
  return api("/settings/smtp", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
}

export async function insertSmtpSettings(settings: Partial<SmtpSettingsRow> & { user_id: string }): Promise<ApiResult<null>> {
  return api("/settings/smtp", { method: "PUT", body: JSON.stringify(settings) });
}

// ── Profiles ─────────────────────────────────────────────────
export async function getProfile(_userId: string): Promise<ApiResult<ProfileRow | null>> {
  return api<ProfileRow | null>("/profiles/me");
}

export async function updateProfile(_userId: string, updates: Partial<ProfileRow>): Promise<ApiResult<null>> {
  return api("/profiles/me", { method: "PUT", body: JSON.stringify(updates) });
}

// ── Audit Log ────────────────────────────────────────────────
export async function getAuditLog(limit = 50): Promise<ApiResult<AuditLogRow[]>> {
  return api<AuditLogRow[]>(`/audit?limit=${limit}`);
}

export async function createAuditEntry(entry: AuditLogInsert): Promise<ApiResult<null>> {
  return api("/audit", { method: "POST", body: JSON.stringify(entry) });
}

// ── Edge Functions (now just API calls) ──────────────────────
export async function invokeFunction(name: string, body: any): Promise<{ data: any; error: any }> {
  if (name === "manage-users") {
    const action = body.action;
    if (action === "list") {
      const result = await api<any[]>("/users");
      return { data: { users: result.data }, error: result.error };
    }
    if (action === "create") {
      const result = await api("/users", { method: "POST", body: JSON.stringify(body) });
      return { data: result.data, error: result.error };
    }
    if (action === "update") {
      const result = await api(`/users/${body.user_id}`, { method: "PUT", body: JSON.stringify(body) });
      return { data: result.data, error: result.error };
    }
    if (action === "delete") {
      const result = await api(`/users/${body.user_id}`, { method: "DELETE" });
      return { data: result.data, error: result.error };
    }
  }
  return { data: null, error: { message: `Unknown function: ${name}` } };
}
