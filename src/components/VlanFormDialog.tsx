import { useState, useEffect } from "react";
import { VlanInfo } from "@/types/network";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VlanFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (vlan: VlanInfo) => void;
  vlan?: VlanInfo | null;
}

const defaultColors = [
  "var(--vlan-firewall)", "var(--vlan-power)", "var(--vlan-infra)",
  "var(--vlan-storage)", "var(--vlan-virt)", "var(--vlan-servers)",
  "var(--vlan-kvm)", "var(--vlan-printers)", "var(--vlan-cameras)",
  "var(--vlan-telecom)", "var(--vlan-warp9)",
];

export default function VlanFormDialog({ open, onClose, onSave, vlan }: VlanFormDialogProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [subnet, setSubnet] = useState("");

  useEffect(() => {
    if (open) {
      if (vlan) {
        setId(String(vlan.id));
        setName(vlan.name);
        setSubnet(vlan.subnet);
      } else {
        setId("");
        setName("");
        setSubnet("");
      }
    }
  }, [open, vlan]);

  const isEdit = !!vlan;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vlanId = Number(id);
    if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) return;
    if (!name.trim() || !subnet.trim()) return;

    const colorIdx = vlanId % defaultColors.length;
    onSave({
      id: vlanId,
      name: name.trim(),
      subnet: subnet.trim(),
      color: vlan?.color || defaultColors[colorIdx],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit VLAN" : "Add VLAN"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">VLAN ID</label>
            <Input
              type="number"
              min={1}
              max={4094}
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEdit}
              placeholder="e.g. 113"
              className="bg-background border-border font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IoT Devices"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Subnet</label>
            <Input
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              placeholder="e.g. 172.16.113.0/24"
              className="bg-background border-border font-mono"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              {isEdit ? "Save" : "Add VLAN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
