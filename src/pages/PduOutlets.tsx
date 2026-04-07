import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Activity, ArrowLeft, Plug, Save, X, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PduOutlet {
  id: string;
  outlet_number: number;
  device_name: string;
  notes: string;
}

export default function PduOutlets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<PduOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PduOutlet>>({});
  const [adding, setAdding] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ outlet_number: 0, device_name: "", notes: "" });

  const fetchOutlets = useCallback(async () => {
    const { data, error } = await supabase.from("pdu_outlets" as any).select("*").order("outlet_number");
    if (error) { toast.error(error.message); return; }
    setOutlets((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchOutlets(); }, [user, fetchOutlets]);

  const startEdit = (o: PduOutlet) => { setEditingId(o.id); setEditForm({ ...o }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("pdu_outlets" as any).update({
      outlet_number: editForm.outlet_number,
      device_name: editForm.device_name,
      notes: editForm.notes,
      updated_at: new Date().toISOString(),
    } as any).eq("id", editingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Outlet updated");
    setEditingId(null);
    fetchOutlets();
  };

  const addOutlet = async () => {
    const nextNum = outlets.length > 0 ? Math.max(...outlets.map(o => o.outlet_number)) + 1 : 1;
    const { error } = await supabase.from("pdu_outlets" as any).insert({
      outlet_number: newOutlet.outlet_number || nextNum,
      device_name: newOutlet.device_name,
      notes: newOutlet.notes,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Outlet added");
    setAdding(false);
    setNewOutlet({ outlet_number: 0, device_name: "", notes: "" });
    fetchOutlets();
  };

  const deleteOutlet = async (id: string) => {
    const { error } = await supabase.from("pdu_outlets" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Outlet removed");
    fetchOutlets();
  };

  const usedCount = outlets.filter(o => o.device_name.trim()).length;

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
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">PDU — CyberPower PDU41003</h1>
              <p className="text-xs text-muted-foreground">{usedCount}/{outlets.length} outlets in use · 16× NEMA 5-20R · 30A / 120V</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Add Outlet
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground w-24">Outlet #</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Device</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Notes</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adding && (
                <TableRow className="border-border bg-primary/5">
                  <TableCell><Input className="h-8 text-xs w-20" type="number" value={newOutlet.outlet_number || ""} onChange={e => setNewOutlet({ ...newOutlet, outlet_number: parseInt(e.target.value) || 0 })} placeholder="#" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newOutlet.device_name} onChange={e => setNewOutlet({ ...newOutlet, device_name: e.target.value })} placeholder="Device name" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newOutlet.notes} onChange={e => setNewOutlet({ ...newOutlet, notes: e.target.value })} placeholder="Notes" /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={addOutlet}><Save className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {outlets.map(outlet => (
                <TableRow key={outlet.id} className="border-border hover:bg-muted/30">
                  {editingId === outlet.id ? (
                    <>
                      <TableCell><Input className="h-8 text-xs w-20" type="number" value={editForm.outlet_number} onChange={e => setEditForm({ ...editForm, outlet_number: parseInt(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.device_name} onChange={e => setEditForm({ ...editForm, device_name: e.target.value })} /></TableCell>
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
                      <TableCell className="font-mono text-xs font-medium text-foreground">{outlet.outlet_number}</TableCell>
                      <TableCell className="text-xs text-foreground">{outlet.device_name || <span className="text-muted-foreground italic">Empty</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{outlet.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(outlet)}>
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
                                <AlertDialogTitle>Delete Outlet {outlet.outlet_number}?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this PDU outlet entry.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteOutlet(outlet.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
