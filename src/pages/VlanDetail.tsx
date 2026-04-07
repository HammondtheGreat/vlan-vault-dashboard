import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { vlans } from "@/data/networkData";
import { useNetwork } from "@/context/NetworkContext";
import { DeviceEntry } from "@/types/network";
import DeviceFormDialog from "@/components/DeviceFormDialog";
import { ArrowLeft, Plus, Pencil, Trash2, Activity, Search } from "lucide-react";
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
  const vlan = vlans.find((v) => v.id === vlanId);
  const { devices, addDevice, updateDevice, deleteDevice } = useNetwork();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceEntry | null>(null);

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
    if (editDevice) {
      updateDevice(vlanId, device);
      toast.success("Device updated");
    } else {
      addDevice(vlanId, device);
      toast.success("Device added");
    }
    setFormOpen(false);
    setEditDevice(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDevice(vlanId, deleteTarget.id);
      toast.success("Device deleted");
      setDeleteTarget(null);
    }
  };

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
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                VLAN {vlan.id} — {vlan.name}
              </h1>
              <p className="font-mono text-xs text-muted-foreground">{vlan.subnet}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setEditDevice(null); setFormOpen(true); }} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
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
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">No devices found</td>
                  </tr>
                ) : (
                  filtered.map((d, i) => (
                    <tr key={d.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card/30" : ""}`}>
                      <td className="px-4 py-2.5 font-mono text-primary text-xs">{d.ipAddress}</td>
                      <td className="px-4 py-2.5 text-foreground font-medium">{d.device || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{d.brand || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{d.model || "—"}</td>
                      <td className="px-4 py-2.5">{d.docs || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{d.location || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.notes || "—"}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} of {allDevices.length} entries shown</p>
      </main>

      <DeviceFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDevice(null); }}
        onSave={handleSave}
        device={editDevice}
        vlanSubnet={vlan.subnet}
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
