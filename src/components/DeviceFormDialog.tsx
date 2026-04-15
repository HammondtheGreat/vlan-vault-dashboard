import { useState, useEffect, useRef } from "react";
import { DeviceEntry, DEVICE_STATUSES } from "@/types/network";
import { findNextAvailableIp } from "@/data/networkData";
import { useNetwork } from "@/context/NetworkContext";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Upload, FileText, X, Loader2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Omit<DeviceEntry, "id">>({
    ipAddress: "",
    device: "",
    brand: "",
    model: "",
    docs: "",
    location: "",
    notes: "",
    status: "",
  });

  useEffect(() => {
    if (device) {
      setForm({ ipAddress: device.ipAddress, device: device.device, brand: device.brand, model: device.model, docs: device.docs, location: device.location, notes: device.notes, status: device.status || "" });
    } else {
      setForm({ ipAddress: "", device: "", brand: "", model: "", docs: "", location: "", notes: "", status: "" });
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = `${vlanId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("device-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("device-docs")
        .getPublicUrl(filePath);

      setForm((f) => ({ ...f, docs: urlData.publicUrl }));
      toast.success("PDF uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const fields: { key: keyof Omit<DeviceEntry, "id" | "updatedAt" | "status" | "docs">; label: string; mono?: boolean; placeholder?: string }[] = [
    { key: "device", label: "Device Name", placeholder: "e.g. sw-mdf-core" },
    { key: "brand", label: "Brand", placeholder: "e.g. Juniper" },
    { key: "model", label: "Model", placeholder: "e.g. EX4300-48MP" },
    { key: "location", label: "Location", placeholder: "e.g. Garage" },
    { key: "notes", label: "Notes", placeholder: "Additional notes" },
  ];

  const isPdfUrl = form.docs.includes("/device-docs/") && form.docs.endsWith(".pdf");

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

          {/* Docs field with PDF upload */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Docs</Label>
            <div className="flex gap-2">
              <Input
                value={form.docs}
                onChange={(e) => setForm((f) => ({ ...f, docs: e.target.value }))}
                placeholder="URL or description"
                className="bg-muted/50 border-border flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-primary/30 text-primary hover:bg-primary/10 shrink-0 gap-1"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                PDF
              </Button>
            </div>
            {isPdfUrl && (
              <div className="flex items-center gap-1.5 mt-1">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <a href={form.docs} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[250px]">
                  Uploaded PDF
                </a>
                <button type="button" onClick={() => setForm((f) => ({ ...f, docs: "" }))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Status dropdown */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v === "none" ? "" : v }))}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder="No status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none">No status</SelectItem>
                {DEVICE_STATUSES.filter(s => s !== "").map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
