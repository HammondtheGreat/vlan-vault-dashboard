import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Activity, ArrowLeft, Wifi, Save, X, Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WirelessNetwork {
  id: string;
  ssid: string;
  password: string;
  notes: string;
  is_hidden: boolean;
  sort_order: number;
}

export default function WirelessNetworks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [networks, setNetworks] = useState<WirelessNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WirelessNetwork>>({});
  const [adding, setAdding] = useState(false);
  const [newNetwork, setNewNetwork] = useState({ ssid: "", password: "", notes: "", is_hidden: false });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const fetchNetworks = useCallback(async () => {
    const { data, error } = await api.getWirelessNetworks();
    if (error) { toast.error(error.message); return; }
    setNetworks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchNetworks(); }, [user, fetchNetworks]);

  const startEdit = (n: WirelessNetwork) => { setEditingId(n.id); setEditForm({ ...n }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await api.updateWirelessNetwork(editingId, {
      ssid: editForm.ssid,
      password: editForm.password,
      notes: editForm.notes,
      is_hidden: editForm.is_hidden,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Network updated");
    setEditingId(null);
    fetchNetworks();
  };

  const addNetwork = async () => {
    const nextOrder = networks.length > 0 ? Math.max(...networks.map(n => n.sort_order)) + 1 : 0;
    const { error } = await api.createWirelessNetwork({
      ssid: newNetwork.ssid,
      password: newNetwork.password,
      notes: newNetwork.notes,
      is_hidden: newNetwork.is_hidden,
      sort_order: nextOrder,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Network added");
    setAdding(false);
    setNewNetwork({ ssid: "", password: "", notes: "", is_hidden: false });
    fetchNetworks();
  };

  const deleteNetwork = async (id: string) => {
    const { error } = await api.deleteWirelessNetwork(id);
    if (error) { toast.error(error.message); return; }
    toast.success("Network removed");
    fetchNetworks();
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Wireless Networks</h1>
              <p className="text-xs text-muted-foreground">{networks.length} network{networks.length !== 1 ? "s" : ""} configured</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Add Network
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">SSID</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Password</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Notes</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20 text-center">Hidden</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adding && (
                <TableRow className="border-border bg-primary/5">
                  <TableCell><Input className="h-8 text-xs" value={newNetwork.ssid} onChange={e => setNewNetwork({ ...newNetwork, ssid: e.target.value })} placeholder="Network name" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" type="password" value={newNetwork.password} onChange={e => setNewNetwork({ ...newNetwork, password: e.target.value })} placeholder="Password" /></TableCell>
                  <TableCell><Input className="h-8 text-xs" value={newNetwork.notes} onChange={e => setNewNetwork({ ...newNetwork, notes: e.target.value })} placeholder="Notes" /></TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={newNetwork.is_hidden} onCheckedChange={(checked) => setNewNetwork({ ...newNetwork, is_hidden: checked === true })} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={addNetwork}><Save className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {networks.map(network => (
                <TableRow key={network.id} className="border-border hover:bg-muted/30">
                  {editingId === network.id ? (
                    <>
                      <TableCell><Input className="h-8 text-xs" value={editForm.ssid} onChange={e => setEditForm({ ...editForm, ssid: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></TableCell>
                      <TableCell className="text-center">
                        <Checkbox checked={editForm.is_hidden} onCheckedChange={(checked) => setEditForm({ ...editForm, is_hidden: checked === true })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={saveEdit}><Save className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-xs font-medium text-foreground">{network.ssid || <span className="text-muted-foreground italic">No SSID</span>}</TableCell>
                      <TableCell className="text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{showPasswords[network.id] ? network.password : network.password ? "••••••••" : "—"}</span>
                          {network.password && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => togglePasswordVisibility(network.id)}>
                              {showPasswords[network.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{network.notes || "—"}</TableCell>
                      <TableCell className="text-center">
                        {network.is_hidden ? (
                          <EyeOff className="h-3.5 w-3.5 text-warning mx-auto" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(network)}>
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
                                <AlertDialogTitle>Delete "{network.ssid}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this wireless network entry.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteNetwork(network.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {networks.length === 0 && !adding && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    No wireless networks yet. Click "Add Network" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
