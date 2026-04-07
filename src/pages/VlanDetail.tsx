import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findNextAvailableIp, isStale } from "@/data/networkData";
import { useNetwork } from "@/context/NetworkContext";
import { DeviceEntry, VlanInfo } from "@/types/network";
import DeviceFormDialog from "@/components/DeviceFormDialog";
import VlanFormDialog from "@/components/VlanFormDialog";
import JunosConfigGenerator from "@/components/JunosConfigGenerator";
import { ArrowLeft, Plus, Pencil, Trash2, Activity, Search, Zap, Clock, AlertTriangle, FileText, Settings2 } from "lucide-react";
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
  const { devices, vlans, addDevice, updateDevice, deleteDevice, updateVlan, deleteVlan } = useNetwork();
  const vlan = vlans.find((v) => v.id === vlanId);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceEntry | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [deleteVlanOpen, setDeleteVlanOpen] = useState(false);
  const [vlanEditOpen, setVlanEditOpen] = useState(false);
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

  const handleSave = async (device: DeviceEntry) => {
    let success: boolean;
    if (editDevice) {
      success = await updateDevice(vlanId, device);
      if (success) toast.success("Device updated");
    } else {
      success = await addDevice(vlanId, device);
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

  const handleDeleteVlan = () => {
    deleteVlan(vlanId);
    toast.success(`VLAN ${vlanId} deleted`);
    navigate("/");
  };

  const handleVlanEdit = async (updatedVlan: VlanInfo) => {
    await updateVlan(vlanId, {
      id: updatedVlan.id,
      name: updatedVlan.name,
      subnet: updatedVlan.subnet,
    });
    toast.success("VLAN updated");
    setVlanEditOpen(false);
    if (updatedVlan.id !== vlanId) {
      navigate(`/vlan/${updatedVlan.id}`);
    }
  };

  const statusBadge = (status: string) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      "In Use": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      "Future": "bg-blue-500/15 text-blue-400 border-blue-500/20",
      "Reserved": "bg-amber-500/15 text-amber-400 border-amber-500/20",
      "Bad": "bg-destructive/15 text-destructive border-destructive/20",
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[status] || "bg-muted text-muted-foreground border-border"}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate("/")} className="h-8 w-8 shrink-0 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
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
                      className="text-base sm:text-lg font-semibold tracking-tight text-foreground cursor-pointer hover:text-primary transition-colors group truncate"
                      title="Click to edit name"
                    >
                      <span className="hidden sm:inline">VLAN {vlan.id} — </span>
                      <span className="sm:hidden">V{vlan.id}: </span>
                      {vlan.name}
                      <Pencil className="inline-block ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h1>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground">{vlan.subnet}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setVlanEditOpen(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Edit VLAN</span><span className="sm:hidden">Edit</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteVlanOpen(true)} className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Delete VLAN</span><span className="sm:hidden">Delete</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleNextAvailable} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Next Available IP</span><span className="sm:hidden">Next IP</span>
            </Button>
            <Button size="sm" onClick={() => { setEditDevice(null); setFormOpen(true); }} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 ml-auto">
              <Plus className="h-4 w-4" /> Add Device
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 space-y-4 px-4">
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
                        <td className="px-4 py-2.5">
                          {d.docs ? (
                            <a href={d.docs.startsWith("http") ? d.docs : undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors" title={d.docs}>
                              <FileText className="h-3.5 w-3.5" />
                              <span className="text-xs max-w-[80px] truncate">{d.docs.startsWith("http") ? "Link" : d.docs}</span>
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.location || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.notes || "—"}</td>
                        <td className="px-4 py-2.5">
                          {d.status ? statusBadge(d.status) : (
                            stale ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                <Clock className="h-2.5 w-2.5" />
                                STALE
                              </span>
                            ) : d.device ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                OK
                              </span>
                            ) : null
                          )}
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

      <VlanFormDialog open={vlanEditOpen} onClose={() => setVlanEditOpen(false)} onSave={handleVlanEdit} vlan={vlan} />

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

      <AlertDialog open={deleteVlanOpen} onOpenChange={(o) => !o && setDeleteVlanOpen(false)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete VLAN {vlanId}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete VLAN {vlanId} ({vlan.name}) and all {allDevices.length} device entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete VLAN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
