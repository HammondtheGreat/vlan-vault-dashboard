// Column whitelists for safe dynamic UPDATE queries

export const ALLOWED_COLUMNS = {
  vlans: ["vlan_id", "name", "subnet", "color", "icon"],
  devices: ["vlan_id", "ip_address", "device_name", "brand", "model", "docs", "location", "notes", "status"],
  rack_items: ["device_id", "start_u", "u_size", "label", "notes"],
  cable_drops: ["label", "location", "category", "switch_model", "switch_port", "notes", "sort_order"],
  pdu_outlets: ["outlet_number", "device_name", "notes"],
  wireless_networks: ["ssid", "password", "notes", "is_hidden", "sort_order"],
  profiles: ["display_name", "avatar_url"],
  app_settings: ["site_name", "page_title", "favicon_url", "user_id"],
  smtp_settings: ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "from_email", "from_name", "use_tls", "user_id"],
  users: ["email", "password_hash"],
};

/**
 * Build safe SET clause from request body, filtering to allowed columns only.
 * Returns { sets: string[], vals: any[] } or null if nothing valid.
 */
export function safeSets(table, body, transforms = {}) {
  const allowed = ALLOWED_COLUMNS[table];
  if (!allowed) return null;
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.includes(k)) continue;
    sets.push(`${k} = ?`);
    vals.push(transforms[k] ? transforms[k](v) : v);
  }
  return sets.length ? { sets, vals } : null;
}
