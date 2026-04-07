import { useRef } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { DeviceEntry, VlanInfo } from "@/types/network";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

function buildExportData(vlans: VlanInfo[], devices: Record<number, DeviceEntry[]>) {
  return vlans.map((v) => ({
    vlan: { id: v.id, name: v.name, subnet: v.subnet },
    devices: (devices[v.id] || []).map(({ id, ...rest }) => rest),
  }));
}

function flattenToCsv(vlans: VlanInfo[], devices: Record<number, DeviceEntry[]>): string {
  const headers = ["vlan_id", "vlan_name", "subnet", "ip_address", "device", "brand", "model", "docs", "location", "notes", "updated_at"];
  const rows = [headers.join(",")];
  for (const v of vlans) {
    const devs = devices[v.id] || [];
    if (devs.length === 0) {
      rows.push([v.id, esc(v.name), esc(v.subnet), "", "", "", "", "", "", "", ""].join(","));
    } else {
      for (const d of devs) {
        rows.push([v.id, esc(v.name), esc(v.subnet), esc(d.ipAddress), esc(d.device), esc(d.brand), esc(d.model), esc(d.docs), esc(d.location), esc(d.notes), d.updatedAt || ""].join(","));
      }
    }
  }
  return rows.join("\n");
}

function esc(val: string): string {
  if (!val) return "";
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        current.push(field);
        field = "";
        if (current.some((c) => c.trim())) rows.push(current);
        current = [];
        if (ch === "\r") i++;
      } else {
        field += ch;
      }
    }
  }
  current.push(field);
  if (current.some((c) => c.trim())) rows.push(current);
  return rows;
}

interface ImportData {
  vlans: VlanInfo[];
  devices: Record<number, DeviceEntry[]>;
}

function parseJsonImport(text: string): ImportData {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("Expected an array of VLAN objects");
  const vlans: VlanInfo[] = [];
  const devices: Record<number, DeviceEntry[]> = {};
  for (const entry of data) {
    const v = entry.vlan;
    if (!v || typeof v.id !== "number") throw new Error("Invalid VLAN entry");
    vlans.push({ id: v.id, name: v.name || "", subnet: v.subnet || "", color: v.color || "var(--vlan-infra)" });
    devices[v.id] = (entry.devices || []).map((d: any) => ({
      id: crypto.randomUUID(),
      ipAddress: d.ip_address || d.ipAddress || "",
      device: d.device || "",
      brand: d.brand || "",
      model: d.model || "",
      docs: d.docs || "",
      location: d.location || "",
      notes: d.notes || "",
      updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
    }));
  }
  return { vlans, devices };
}

function parseCsvImport(text: string): ImportData {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV must have a header row and at least one data row");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const vlanIdIdx = header.indexOf("vlan_id");
  const vlanNameIdx = header.indexOf("vlan_name");
  const subnetIdx = header.indexOf("subnet");
  const ipIdx = header.indexOf("ip_address");
  const deviceIdx = header.indexOf("device");
  const brandIdx = header.indexOf("brand");
  const modelIdx = header.indexOf("model");
  const docsIdx = header.indexOf("docs");
  const locIdx = header.indexOf("location");
  const notesIdx = header.indexOf("notes");
  const updIdx = header.indexOf("updated_at");

  if (vlanIdIdx === -1) throw new Error("CSV must have a 'vlan_id' column");

  const col = (row: string[], idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

  const vlansMap = new Map<number, VlanInfo>();
  const devices: Record<number, DeviceEntry[]> = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = Number(col(r, vlanIdIdx));
    if (isNaN(id)) continue;
    if (!vlansMap.has(id)) {
      vlansMap.set(id, { id, name: col(r, vlanNameIdx) || `VLAN ${id}`, subnet: col(r, subnetIdx) || "", color: "var(--vlan-infra)" });
      devices[id] = [];
    }
    const ip = col(r, ipIdx);
    if (ip) {
      devices[id].push({
        id: crypto.randomUUID(),
        ipAddress: ip,
        device: col(r, deviceIdx),
        brand: col(r, brandIdx),
        model: col(r, modelIdx),
        docs: col(r, docsIdx),
        location: col(r, locIdx),
        notes: col(r, notesIdx),
        updatedAt: col(r, updIdx) || new Date().toISOString(),
      });
    }
  }
  return { vlans: Array.from(vlansMap.values()).sort((a, b) => a.id - b.id), devices };
}

export default function ImportExportButtons() {
  const { vlans, devices, importData } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const data = buildExportData(vlans, devices);
    downloadFile(JSON.stringify(data, null, 2), `warp9net-ipam-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    toast.success("Exported as JSON");
  };

  const handleExportCsv = () => {
    const csv = flattenToCsv(vlans, devices);
    downloadFile(csv, `warp9net-ipam-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("Exported as CSV");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const text = await file.text();
      let parsed: ImportData;
      if (file.name.endsWith(".json")) {
        parsed = parseJsonImport(text);
      } else if (file.name.endsWith(".csv")) {
        parsed = parseCsvImport(text);
      } else {
        toast.error("Unsupported file type. Use .json or .csv");
        return;
      }
      if (parsed.vlans.length === 0) {
        toast.error("No VLANs found in file");
        return;
      }
      importData(parsed.vlans, parsed.devices);
      const totalDevices = Object.values(parsed.devices).reduce((s, d) => s + d.length, 0);
      toast.success(`Imported ${parsed.vlans.length} VLANs and ${totalDevices} devices`);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleFileChange} className="hidden" />

      <Button size="sm" variant="outline" onClick={handleImport} className="gap-1.5 border-border text-muted-foreground hover:text-foreground">
        <Upload className="h-4 w-4" /> Import
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5 border-border text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem onClick={handleExportJson} className="gap-2 cursor-pointer">
            <FileJson className="h-4 w-4 text-primary" /> Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
