import { useState, useEffect } from "react";
import { DeviceEntry } from "@/types/network";
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (device: DeviceEntry) => void;
  device: DeviceEntry | null;
  vlanSubnet: string;
}

export default function DeviceFormDialog({ open, onClose, onSave, device, vlanSubnet }: Props) {
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
      setForm({ ...device });
    } else {
      setForm({ ipAddress: "", device: "", brand: "", model: "", docs: "", location: "", notes: "" });
    }
  }, [device, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: device?.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...form,
    });
  };

  const fields: { key: keyof Omit<DeviceEntry, "id">; label: string; mono?: boolean; placeholder?: string }[] = [
    { key: "ipAddress", label: "IP Address", mono: true, placeholder: "e.g. 172.16.100.5" },
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
          {fields.map(({ key, label, mono, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={form[key]}
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
