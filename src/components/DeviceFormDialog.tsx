import { useState, useEffect } from "react";
import { DeviceEntry } from "@/types/network";
import { findNextAvailableIp } from "@/data/networkData";
import { useNetwork } from "@/context/NetworkContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (device: DeviceEntry) => void;
  device: DeviceEntry | null;
  vlanSubnet: string;
  vlanId: number;
}

export default function DeviceFormDialog({ open, onClose, onSave, device, vlanSubnet, vlanId }: Props) {
  const { devices } = useNetwork();
  const [form, setForm] = useState<Omit<DeviceEntry, "id">>({
    ipAddress: "",
    device: "",
    brand: "",
    model: "",
    docs: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (device) {
      setForm({ ipAddress: device.ipAddress, device: device.device, brand: device.brand, model: device.model, docs: device.docs, location: device.location, notes: device.notes });
    } else {
      setForm({ ipAddress: "", device: "", brand: "", model: "", docs: "", location: "", notes: "" });
    }
  }, [device, open]);

  const handleNextIp = () => {
    const existing = devices[vlanId] || [];
    const nextIp = findNextAvailableIp(vlanSubnet, existing);
    if (nextIp) {
      setForm((f) => ({ ...f, ipAddress: nextIp }));
      toast.success(`Next available: ${nextIp}`);
    } else {
      toast.error("No available IPs in this subnet");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ipAddress.trim()) {
      toast.error("IP Address is required");
      return;
    }
    onSave({
      id: device?.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...form,
    });
  };

  const fields: { key: keyof Omit<DeviceEntry, "id" | "updatedAt">; label: string; mono?: boolean; placeholder?: string }[] = [
    { key: "device", label: "Device Name", placeholder: "e.g. sw-mdf-core" },
    { key: "brand", label: "Brand", placeholder: "e.g. Juniper" },
    { key: "model", label: "Model", placeholder: "e.g. EX4300-48MP" },
    { key: "docs", label: "Docs", placeholder: "📖 or URL" },
    { key: "location", label: "Location", placeholder: "e.g. Garage" },
    { key: "notes", label: "Notes", placeholder: "Additional notes" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{device ? "Edit Device" : "Add Device"}</DialogTitle>
          <p className="text-xs font-mono text-muted-foreground">{vlanSubnet}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* IP Address with Next Available button */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">IP Address</Label>
            <div className="flex gap-2">
              <Input
                value={form.ipAddress}
                onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                placeholder="e.g. 172.16.100.5"
                className="bg-muted/50 border-border font-mono flex-1"
              />
              {!device && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextIp}
                  className="border-primary/30 text-primary hover:bg-primary/10 shrink-0 gap-1"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Next IP
                </Button>
              )}
            </div>
          </div>

          {fields.map(({ key, label, mono, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={(form as any)[key] || ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className={`bg-muted/50 border-border ${mono ? "font-mono" : ""}`}
              />
            </div>
          ))}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-muted-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {device ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
