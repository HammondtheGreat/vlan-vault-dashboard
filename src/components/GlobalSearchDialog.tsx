import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNetwork } from "@/context/NetworkContext";
import { DeviceEntry } from "@/types/network";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

interface SearchResult {
  vlanId: number;
  vlanName: string;
  device: DeviceEntry;
}

export default function GlobalSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { devices, vlans } = useNetwork();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];
    for (const vlan of vlans) {
      for (const d of devices[vlan.id] || []) {
        if (
          d.ipAddress.toLowerCase().includes(q) ||
          d.device.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.notes.toLowerCase().includes(q)
        ) {
          matches.push({ vlanId: vlan.id, vlanName: vlan.name, device: d });
        }
        if (matches.length >= 50) break;
      }
      if (matches.length >= 50) break;
    }
    return matches;
  }, [query, devices, vlans]);

  const goTo = (vlanId: number) => {
    onClose();
    navigate(`/vlan/${vlanId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-lg p-0 gap-0 overflow-hidden [&>button.absolute]:hidden">
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all VLANs… (IP, device, brand, model)"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 py-4 text-sm"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.vlanId}-${r.device.id}`}
              onClick={() => goTo(r.vlanId)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">{r.device.ipAddress}</span>
                  <span className="text-xs text-muted-foreground">—</span>
                  <span className="text-sm text-foreground font-medium truncate">{r.device.device || "unnamed"}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.device.brand && <span className="text-xs text-muted-foreground">{r.device.brand}</span>}
                  {r.device.model && <span className="text-xs text-muted-foreground font-mono">{r.device.model}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono text-muted-foreground">VLAN {r.vlanId}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </button>
          ))}
          {!query.trim() && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Search across all {vlans.length} VLANs simultaneously
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
