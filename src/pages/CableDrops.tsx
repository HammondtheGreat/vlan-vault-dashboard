import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Activity, Plus, Trash2, Save, X, Cable, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SWITCH_OPTIONS = [
  "",
  "Juniper EX4300-48MP",
  "Juniper QFX5100-48S-3AFO",
];

interface CableDrop {
  id: string;
  label: string;
  location: string;
  category: string;
  switch_model: string;
  switch_port: string;
  notes: string;
  sort_order: number;
}

export default function CableDrops() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drops, setDrops] = useState<CableDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CableDrop>>({});
  const [adding, setAdding] = useState(false);
  const [newDrop, setNewDrop] = useState<Partial<CableDrop>>({ label: "", location: "", category: "", switch_model: "", switch_port: "", notes: "" });

  const fetchDrops = useCallback(async () => {
    const { data, error } = await supabase.from("cable_drops" as any).select("*").order("sort_order");
    if (error) { toast.error(error.message); return; }
    setDrops((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchDrops(); }, [user, fetchDrops]);

  const startEdit = (drop: CableDrop) => {
    setEditingId(drop.id);
    setEditForm({ ...drop });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("cable_drops" as any).update({
      label: editForm.label,
      location: editForm.location,
      category: editForm.category,
      switch_model: editForm.switch_model,
      switch_port: editForm.switch_port,
      notes: editForm.notes,
      updated_at: new Date().toISOString(),
    } as any).eq("id", editingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Drop updated");
    setEditingId(null);
    fetchDrops();
  };

  const addDrop = async () => {
    const maxOrder = drops.length > 0 ? Math.max(...drops.map(d => d.sort_order)) : 0;
    const { error } = await supabase.from("cable_drops" as any).insert({
      label: newDrop.label || "",
      location: newDrop.location || "",
      category: newDrop.category || "",
      switch_model: newDrop.switch_model || "",
      switch_port: newDrop.switch_port || "",
      notes: newDrop.notes || "",
      sort_order: maxOrder + 1,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Drop added");
    setAdding(false);
    setNewDrop({ label: "", location: "", category: "", switch_model: "", switch_port: "", notes: "" });
    fetchDrops();
  };

  const deleteDrop = async (id: string) => {
    const { error } = await supabase.from("cable_drops" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Drop removed");
    fetchDrops();
  };

  const renderSwitchSelect = (value: string, onChange: (v: string) => void) => (
    <Select value={value || "__empty__"} onValueChange={(v) => onChange(v === "__empty__" ? "" : v)}>
      <SelectTrigger className="h-8 text-xs w-full min-w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__empty__">—</SelectItem>
        {SWITCH_OPTIONS.filter(Boolean).map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="h-8 w-8 rounded-md bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Cable className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Cable Drops</h1>
              <p className="text-xs text-muted-foreground">{drops.length} network drops</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Add Drop
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground w-24">Label</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Location</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-24">Category</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground min-w-[180px]">Switch</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20">Port</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Notes</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adding && (
                <TableRow className="border-border bg-primary/5">
                  <TableCell><Input className="h-8 text-xs" value={newDrop.label} onChange={e => setNewDrop({ ...newDrop, label: e.target.value })} placeholder="W-XX" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newDrop.location} onChange={e => setNewDrop({ ...newDrop, location: e.target.value })} placeholder="Location" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newDrop.category} onChange={e => setNewDrop({ ...newDrop, category: e.target.value })} placeholder="Data/Camera" /></TableCell>
                  <TableCell>{renderSwitchSelect(newDrop.switch_model || "", v => setNewDrop({ ...newDrop, switch_model: v }))}</TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newDrop.switch_port} onChange={e => setNewDrop({ ...newDrop, switch_port: e.target.value })} placeholder="Port" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newDrop.notes} onChange={e => setNewDrop({ ...newDrop, notes: e.target.value })} placeholder="Notes" /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={addDrop}><Save className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {drops.map(drop => (
                <TableRow key={drop.id} className="border-border hover:bg-muted/30">
                  {editingId === drop.id ? (
                    <>
                      <TableCell><Input className="h-8 text-xs" value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></TableCell>
                      <TableCell>{renderSwitchSelect(editForm.switch_model || "", v => setEditForm({ ...editForm, switch_model: v }))}</TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.switch_port} onChange={e => setEditForm({ ...editForm, switch_port: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={saveEdit}><Save className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-mono text-xs font-medium text-foreground">{drop.label}</TableCell>
                      <TableCell className="text-xs text-foreground">{drop.location}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{drop.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{drop.switch_model || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{drop.switch_port || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{drop.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(drop)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {drop.label}?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this cable drop.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDrop(drop.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
