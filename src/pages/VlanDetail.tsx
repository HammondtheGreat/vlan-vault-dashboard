import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findNextAvailableIp, isStale } from "@/data/networkData";
import { useNetwork } from "@/context/NetworkContext";
import { DeviceEntry } from "@/types/network";
import DeviceFormDialog from "@/components/DeviceFormDialog";
import JunosConfigGenerator from "@/components/JunosConfigGenerator";
import { ArrowLeft, Plus, Pencil, Trash2, Activity, Search, Zap, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function VlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vlanId = Number(id);
  const { devices, vlans, addDevice, updateDevice, deleteDevice, updateVlan } = useNetwork();
  const vlan = vlans.find((v) => v.id === vlanId);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceEntry | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (!vlan) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">VLAN not found</div>;

  const allDevices = devices[vlanId] || [];
  const filtered = allDevices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.ipAddress.toLowerCase().includes(q) ||
      d.device.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.notes.toLowerCase().includes(q)
    );
  });

  const handleSave = (device: DeviceEntry) => {
    let success: boolean;
    if (editDevice) {
      success = updateDevice(vlanId, device);
      if (success) toast.success("Device updated");
    } else {
      success = addDevice(vlanId, device);
      if (success) toast.success("Device added");
    }
    if (success) {
      setFormOpen(false);
      setEditDevice(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDevice(vlanId, deleteTarget.id);
      toast.success("Device deleted");
      setDeleteTarget(null);
    }
  };

  const handleNextAvailable = () => {
    const nextIp = findNextAvailableIp(vlan.subnet, allDevices);
    if (nextIp) {
      toast.info(`Next available IP: ${nextIp}`, { duration: 4000 });
      setEditDevice(null);
      setFormOpen(true);
    } else {
      toast.error("No available IPs in this subnet");
    }
  };

  const handleNameEdit = () => {
    setNameValue(vlan.name);
    setEditingName(true);
  };

  const handleNameSave = () => {
    if (nameValue.trim() && nameValue.trim() !== vlan.name) {
      updateVlan(vlanId, { name: nameValue.trim() });
      toast.success("VLAN name updated");
    }
    setEditingName(false);
  };

  const staleCount = allDevices.filter((d) => d.device && isStale(d)).length;

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {editingName ? (
                  <Input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); if (e.key === "Escape") setEditingName(false); }}
                    className="h-7 text-lg font-semibold bg-background border-primary/40 w-48"
                  />
                ) : (
                  <h1
                    onClick={handleNameEdit}
                    className="text-lg font-semibold tracking-tight text-foreground cursor-pointer hover:text-primary transition-colors group"
                    title="Click to edit name"
                  >
                    VLAN {vlan.id} — {vlan.name}
                    <Pencil className="inline-block ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h1>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{vlan.subnet}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleNextAvailable} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <Zap className="h-4 w-4" /> Next Available IP
            </Button>
            <Button size="sm" onClick={() => { setEditDevice(null); setFormOpen(true); }} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add Device
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          {staleCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{staleCount} stale</span>
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">IP Address</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Device</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Docs</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Notes</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">No devices found</td>
                  </tr>
                ) : (
                  filtered.map((d, i) => {
                    const stale = d.device && isStale(d);
                    return (
                      <tr key={d.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card/30" : ""}`}>
                        <td className="px-4 py-2.5 font-mono text-primary text-xs">{d.ipAddress}</td>
                        <td className="px-4 py-2.5 text-foreground font-medium">{d.device || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.brand || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{d.model || "—"}</td>
                        <td className="px-4 py-2.5">{d.docs || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.location || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.notes || "—"}</td>
                        <td className="px-4 py-2.5">
                          {stale ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              <Clock className="h-2.5 w-2.5" />
                              STALE
                            </span>
                          ) : d.device ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              OK
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => { setEditDevice(d); setFormOpen(true); }}
                              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(d)}
                              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} of {allDevices.length} entries shown</p>

        <JunosConfigGenerator vlan={vlan} />
      </main>

      <DeviceFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDevice(null); }}
        onSave={handleSave}
        device={editDevice}
        vlanSubnet={vlan.subnet}
        vlanId={vlanId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Device</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Remove <span className="font-mono text-foreground">{deleteTarget?.device || deleteTarget?.ipAddress}</span> from VLAN {vlanId}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
