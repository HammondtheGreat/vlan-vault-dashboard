import { useState, useEffect } from "react";
import * as api from "@/api/client";
import type { AuditLogRow } from "@/api/types";
import { Clock, User, Plus, Pencil, Trash2, FileInput } from "lucide-react";

const actionIcons: Record<string, React.ReactNode> = {
  device_added: <Plus className="h-3.5 w-3.5 text-emerald-400" />,
  device_updated: <Pencil className="h-3.5 w-3.5 text-primary" />,
  device_deleted: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
  vlan_added: <Plus className="h-3.5 w-3.5 text-emerald-400" />,
  vlan_updated: <Pencil className="h-3.5 w-3.5 text-primary" />,
  vlan_deleted: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
  data_imported: <FileInput className="h-3.5 w-3.5 text-amber-400" />,
};

function formatAction(entry: AuditLogRow): string {
  const d = entry.details || {};
  switch (entry.action) {
    case "device_added": return `Added device "${d.device_name || ""}" (${entry.entity_id}) to VLAN ${d.vlan_id}`;
    case "device_updated": return `Updated device "${d.device_name || ""}" (${entry.entity_id}) in VLAN ${d.vlan_id}`;
    case "device_deleted": return `Deleted device "${d.device_name || ""}" (${entry.entity_id}) from VLAN ${d.vlan_id}`;
    case "vlan_added": return `Added VLAN ${entry.entity_id} "${d.name || ""}" (${d.subnet || ""})`;
    case "vlan_updated": return `Updated VLAN ${entry.entity_id}${d.name ? ` → "${d.name}"` : ""}`;
    case "vlan_deleted": return `Deleted VLAN ${entry.entity_id} "${d.name || ""}"`;
    case "data_imported": return `Imported ${d.vlans} VLANs and ${d.devices} devices`;
    default: return `${entry.action} on ${entry.entity_type} ${entry.entity_id || ""}`;
  }
}

export default function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await api.getAuditLog(50);
      setEntries(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section className="rounded-lg border border-border bg-card/80 p-4 space-y-3">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Loading audit log…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet. Changes you make will appear here.</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors">
              <div className="mt-0.5 shrink-0">
                {actionIcons[entry.action] || <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{formatAction(entry)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.performed_by_email && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <User className="h-2.5 w-2.5" /> {entry.performed_by_email}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
