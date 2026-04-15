import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Activity, ArrowLeft, Server, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableRackItem, U_SIZE_COLORS } from "@/components/rack/DraggableRackItem";
import { EmptyRackSlot } from "@/components/rack/RackSlot";

interface RackItem {
  id: string;
  device_id: string | null;
  start_u: number;
  u_size: number;
  label: string;
  notes: string;
}

interface Device {
  id: string;
  device_name: string;
  brand: string;
  model: string;
  ip_address: string;
  vlan_id: number;
}

const TOTAL_U = 22;

export default function RackView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rackItems, setRackItems] = useState<RackItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RackItem | null>(null);
  const [form, setForm] = useState({ device_id: "", start_u: 1, u_size: 1, label: "", notes: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    const [rackRes, devRes] = await Promise.all([
      supabase.from("rack_items" as any).select("*").order("start_u"),
      supabase.from("devices").select("*").order("device_name"),
    ]);
    if (rackRes.error) toast.error(rackRes.error.message);
    if (devRes.error) toast.error(devRes.error.message);
    setRackItems((rackRes.data as any[]) || []);
    setDevices((devRes.data as Device[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const occupiedSlots = new Set<number>();
  rackItems.forEach(item => {
    for (let u = item.start_u; u < item.start_u + item.u_size; u++) {
      occupiedSlots.add(u);
    }
  });

  const getAvailableStartUs = (excludeItemId?: string) => {
    const excluded = new Set<number>();
    rackItems.forEach(item => {
      if (item.id === excludeItemId) return;
      for (let u = item.start_u; u < item.start_u + item.u_size; u++) {
        excluded.add(u);
      }
    });
    const available: number[] = [];
    for (let u = 1; u <= TOTAL_U; u++) {
      if (!excluded.has(u)) available.push(u);
    }
    return available;
  };

  const getMaxUSize = (startU: number) => {
    let max = 0;
    for (let u = startU; u <= TOTAL_U; u++) {
      if (occupiedSlots.has(u)) break;
      max++;
    }
    return Math.min(max, 5);
  };

  const canFitAt = (startU: number, uSize: number, excludeItemId: string) => {
    const excluded = new Set<number>();
    rackItems.forEach(item => {
      if (item.id === excludeItemId) return;
      for (let u = item.start_u; u < item.start_u + item.u_size; u++) {
        excluded.add(u);
      }
    });
    for (let u = startU; u < startU + uSize; u++) {
      if (u > TOTAL_U || excluded.has(u)) return false;
    }
    return true;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedItem = active.data.current?.item as RackItem;
    if (!draggedItem) return;

    // Extract target U from droppable id: "slot-{u}"
    const targetU = over.data.current?.uPosition as number;
    if (targetU == null || targetU === draggedItem.start_u) return;

    if (!canFitAt(targetU, draggedItem.u_size, draggedItem.id)) {
      toast.error("Not enough space at that position");
      return;
    }

    // Optimistic update
    setRackItems(prev =>
      prev.map(ri => ri.id === draggedItem.id ? { ...ri, start_u: targetU } : ri)
    );

    const { error } = await supabase
      .from("rack_items" as any)
      .update({ start_u: targetU } as any)
      .eq("id", draggedItem.id);

    if (error) {
      toast.error(error.message);
      fetchData(); // revert
    } else {
      toast.success(`Moved "${draggedItem.label}" to U${targetU}`);
    }
  };

  const addItem = async () => {
    const isBlank = form.device_id === "__blank__";
    const device = !isBlank ? devices.find(d => d.id === form.device_id) : null;
    const { error } = await supabase.from("rack_items" as any).insert({
      device_id: isBlank ? null : (form.device_id || null),
      start_u: form.start_u,
      u_size: form.u_size,
      label: form.label || (device ? device.device_name : "Rack Blank"),
      notes: form.notes,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Item added to rack");
    setAddOpen(false);
    setForm({ device_id: "", start_u: 1, u_size: 1, label: "", notes: "" });
    fetchData();
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("rack_items" as any).delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Item removed from rack");
    setDeleteTarget(null);
    fetchData();
  };

  const usedU = rackItems.reduce((sum, item) => sum + item.u_size, 0);

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  const renderRack = () => {
    const rows: React.ReactNode[] = [];
    let u = TOTAL_U;

    while (u >= 1) {
      const item = rackItems.find(ri => ri.start_u === u);
      if (item) {
        const device = item.device_id ? devices.find(d => d.id === item.device_id) : null;
        rows.push(
          <DraggableRackItem
            key={`item-${item.id}`}
            item={item}
            device={device}
            onClick={() => setDeleteTarget(item)}
          />
        );
        u -= item.u_size;
      } else {
        const covering = rackItems.find(ri => u >= ri.start_u && u < ri.start_u + ri.u_size);
        if (covering) {
          u--;
          continue;
        }
        rows.push(<EmptyRackSlot key={`empty-${u}`} uPosition={u} />);
        u--;
      }
    }

    return rows;
  };

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="h-8 w-8 rounded-md bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">22U Server Rack</h1>
              <p className="text-xs text-muted-foreground">{usedU}/{TOTAL_U}U occupied · {rackItems.length} device{rackItems.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const avail = getAvailableStartUs();
            if (avail.length === 0) { toast.error("Rack is full!"); return; }
            setForm({ device_id: "", start_u: avail[0], u_size: 1, label: "", notes: "" });
            setAddOpen(true);
          }} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </div>
      </header>

      <main className="container py-6 max-w-xl">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-1">
              {renderRack()}
            </div>
          </div>
        </DndContext>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
          {[1, 2, 3, 4, 5].map(size => (
            <div key={size} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded-sm border", U_SIZE_COLORS[size])} />
              <span>{size}U</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">Drag the grip handle to reposition items · Click an item to remove it</p>
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Device to Rack</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={form.device_id} onValueChange={(v) => {
                if (v === "__blank__") {
                  setForm({ ...form, device_id: "__blank__", label: "Rack Blank" });
                } else {
                  const dev = devices.find(d => d.id === v);
                  setForm({ ...form, device_id: v, label: dev?.device_name || form.label });
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select a device or blank…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__blank__">🔲 Rack Blank</SelectItem>
                  {devices.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.device_name} ({d.ip_address})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Device name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start U Position</label>
                <Select value={String(form.start_u)} onValueChange={v => {
                  const startU = parseInt(v);
                  const maxSize = getMaxUSize(startU);
                  setForm({ ...form, start_u: startU, u_size: Math.min(form.u_size, maxSize) || 1 });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableStartUs().map(u => (
                      <SelectItem key={u} value={String(u)}>U{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Size (U)</label>
                <Select value={String(form.u_size)} onValueChange={v => setForm({ ...form, u_size: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getMaxUSize(form.start_u) }, (_, i) => i + 1).map(s => (
                      <SelectItem key={s} value={String(s)}>{s}U</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addItem}>Add to Rack</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.label}" from rack?</AlertDialogTitle>
            <AlertDialogDescription>This only removes it from the rack view, not from your IPAM.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
