// Backend API types
// These types define the contract between the React frontend and the Express REST API.

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: { message: string } | null;
}

// ── VLANs ────────────────────────────────────────────────────
export interface VlanRow {
  id: string;
  vlan_id: number;
  name: string;
  subnet: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface VlanInsert {
  vlan_id: number;
  name: string;
  subnet: string;
  color: string;
  icon?: string;
}

export interface VlanUpdate {
  vlan_id?: number;
  name?: string;
  subnet?: string;
  color?: string;
  icon?: string;
  updated_at?: string;
}

// ── Devices ──────────────────────────────────────────────────
export interface DeviceRow {
  id: string;
  vlan_id: number;
  ip_address: string;
  device_name: string;
  brand: string;
  model: string;
  docs: string;
  location: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceInsert {
  vlan_id: number;
  ip_address: string;
  device_name: string;
  brand: string;
  model: string;
  docs: string;
  location: string;
  notes: string;
  status: string;
}

export interface DeviceUpdate {
  vlan_id?: number;
  ip_address?: string;
  device_name?: string;
  brand?: string;
  model?: string;
  docs?: string;
  location?: string;
  notes?: string;
  status?: string;
  updated_at?: string;
}

// ── Rack Items ───────────────────────────────────────────────
export interface RackItemRow {
  id: string;
  device_id: string | null;
  start_u: number;
  u_size: number;
  label: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RackItemInsert {
  device_id?: string | null;
  start_u: number;
  u_size: number;
  label: string;
  notes: string;
}

export interface RackItemUpdate {
  start_u?: number;
  u_size?: number;
  label?: string;
  notes?: string;
}

// ── Cable Drops ──────────────────────────────────────────────
export interface CableDropRow {
  id: string;
  label: string;
  location: string;
  category: string;
  switch_model: string;
  switch_port: string;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CableDropInsert {
  label: string;
  location: string;
  category: string;
  switch_model: string;
  switch_port: string;
  notes: string;
  sort_order: number;
}

export interface CableDropUpdate {
  label?: string;
  location?: string;
  category?: string;
  switch_model?: string;
  switch_port?: string;
  notes?: string;
  updated_at?: string;
}

// ── PDU Outlets ──────────────────────────────────────────────
export interface PduOutletRow {
  id: string;
  outlet_number: number;
  device_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PduOutletInsert {
  outlet_number: number;
  device_name: string;
  notes: string;
}

export interface PduOutletUpdate {
  outlet_number?: number;
  device_name?: string;
  notes?: string;
  updated_at?: string;
}

// ── Wireless Networks ────────────────────────────────────────
export interface WirelessNetworkRow {
  id: string;
  ssid: string;
  password: string;
  notes: string;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WirelessNetworkInsert {
  ssid: string;
  password: string;
  notes: string;
  is_hidden: boolean;
  sort_order: number;
}

export interface WirelessNetworkUpdate {
  ssid?: string;
  password?: string;
  notes?: string;
  is_hidden?: boolean;
  updated_at?: string;
}

// ── App Settings ─────────────────────────────────────────────
export interface AppSettingsRow {
  id: string;
  user_id: string;
  site_name: string;
  page_title: string;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── SMTP Settings ────────────────────────────────────────────
export interface SmtpSettingsRow {
  id: string;
  user_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  created_at: string;
  updated_at: string;
}

// ── Profiles ─────────────────────────────────────────────────
export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Audit Log ────────────────────────────────────────────────
export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  performed_by: string | null;
  performed_by_email: string | null;
  created_at: string;
}

export interface AuditLogInsert {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  performed_by?: string;
  performed_by_email?: string;
}
