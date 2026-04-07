import { useState } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { VlanInfo } from "@/types/network";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import VlanFormDialog from "@/components/VlanFormDialog";
import { toast } from "sonner";

export default function VlanSummaryTable() {
  const { vlans, updateVlan, deleteVlan, addVlan } = useNetwork();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ id: "", name: "", subnet: "" });
  const [addOpen, setAddOpen] = useState(false);

  const startEdit = (vlan: VlanInfo) => {
    setEditingId(vlan.id);
    setEditValues({ id: String(vlan.id), name: vlan.name, subnet: vlan.subnet });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (editingId === null) return;
    const newId = Number(editValues.id);
    if (isNaN(newId) || newId < 1 || newId > 4094) { toast.error("VLAN ID must be 1–4094"); return; }
    if (!editValues.name.trim() || !editValues.subnet.trim()) { toast.error("Name and subnet are required"); return; }

    await updateVlan(editingId, {
      id: newId,
      name: editValues.name.trim(),
      subnet: editValues.subnet.trim(),
    });
    setEditingId(null);
    toast.success("VLAN updated");
  };

  const handleDelete = async (vlanId: number, name: string) => {
    if (!confirm(`Delete VLAN ${vlanId} (${name})? All devices in this VLAN will also be deleted.`)) return;
    await deleteVlan(vlanId);
    toast.success(`VLAN ${vlanId} deleted`);
  };

  const handleAdd = async (vlan: VlanInfo) => {
    if (await addVlan(vlan)) {
      toast.success(`VLAN ${vlan.id} added`);
      setAddOpen(false);
    }
  };

  const sorted = [...vlans].sort((a, b) => a.id - b.id);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">VLAN Summary</h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="h-4 w-4" /> Add VLAN
        </Button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-24">VLAN ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Subnet (CIDR)</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((vlan) =>
              editingId === vlan.id ? (
                <TableRow key={vlan.id}>
                  <TableCell>
                    <Input
                      type="number" min={1} max={4094}
                      value={editValues.id}
                      onChange={(e) => setEditValues({ ...editValues, id: e.target.value })}
                      className="h-8 w-20 font-mono bg-background border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="h-8 bg-background border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editValues.subnet}
                      onChange={(e) => setEditValues({ ...editValues, subnet: e.target.value })}
                      className="h-8 font-mono bg-background border-border"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-emerald-500 hover:text-emerald-400">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={vlan.id}>
                  <TableCell className="font-mono text-muted-foreground">{vlan.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{vlan.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{vlan.subnet}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(vlan)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(vlan.id, vlan.name)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No VLANs configured</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <VlanFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} />
    </section>
  );
}
