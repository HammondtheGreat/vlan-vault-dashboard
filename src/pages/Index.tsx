import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNetwork } from "@/context/NetworkContext";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { parseSubnet, isStale } from "@/data/networkData";
import GlobalSearchDialog from "@/components/GlobalSearchDialog";
import ImportExportButtons from "@/components/ImportExportButtons";
import VlanFormDialog from "@/components/VlanFormDialog";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import VlanSummaryTable from "@/components/VlanSummaryTable";
import AuditLogPanel from "@/components/AuditLogPanel";
import IconPicker, { AVAILABLE_ICONS } from "@/components/IconPicker";
import { VlanInfo } from "@/types/network";
import { Network, Activity, LogOut, Search, Plus, Settings, BarChart3, ScrollText, Menu, Globe, List, Cable, Plug, ChevronDown, X, Palette, Wifi, Server, Printer } from "lucide-react";
import UserAvatarMenu from "@/components/UserAvatarMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, THEMES } from "@/context/ThemeContext";
import { toast } from "sonner";

const vlanColorClasses: Record<number, string> = {
  100: "border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
  101: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
  102: "border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10",
  103: "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10",
  104: "border-green-500/40 bg-green-500/5 hover:bg-green-500/10",
  105: "border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10",
  106: "border-pink-500/40 bg-pink-500/5 hover:bg-pink-500/10",
  107: "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10",
  108: "border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10",
  109: "border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10",
  110: "border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10",
  111: "border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10",
  112: "border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
};

const defaultColorClass = "border-slate-500/40 bg-slate-500/5 hover:bg-slate-500/10";

const iconColorClasses: Record<number, string> = {
  100: "text-red-400", 101: "text-amber-400", 102: "text-cyan-400",
  103: "text-purple-400", 104: "text-green-400", 105: "text-blue-400",
  106: "text-pink-400", 107: "text-orange-400", 108: "text-rose-400",
  109: "text-teal-400", 110: "text-cyan-300", 111: "text-cyan-400", 112: "text-red-400",
};

const defaultIconColor = "text-slate-400";

const badgeColorClasses: Record<number, string> = {
  100: "bg-red-500/20 text-red-300", 101: "bg-amber-500/20 text-amber-300",
  102: "bg-cyan-500/20 text-cyan-300", 103: "bg-purple-500/20 text-purple-300",
  104: "bg-green-500/20 text-green-300", 105: "bg-blue-500/20 text-blue-300",
  106: "bg-pink-500/20 text-pink-300", 107: "bg-orange-500/20 text-orange-300",
  108: "bg-rose-500/20 text-rose-300", 109: "bg-teal-500/20 text-teal-300",
  110: "bg-cyan-400/20 text-cyan-200", 111: "bg-cyan-500/20 text-cyan-300",
  112: "bg-red-500/20 text-red-300",
};

const defaultBadgeColor = "bg-slate-500/20 text-slate-300";

export default function Dashboard() {
  const navigate = useNavigate();
  const { devices, vlans, addVlan, updateVlan, loading } = useNetwork();
  const { signOut } = useAuth();
  const { settings } = useAppSettings();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [vlanFormOpen, setVlanFormOpen] = useState(false);
  const [activeView, setActiveView] = useState<"summary" | "analytics" | "audit" | null>(null);
  const toggleView = (view: "summary" | "analytics" | "audit") =>
    setActiveView((prev) => (prev === view ? null : view));
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeView) setActiveView(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView]);
  // Apply page title dynamically
  useEffect(() => {
    document.title = settings.page_title;
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = settings.favicon_url;
    }
  }, [settings.page_title, settings.favicon_url]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const homeVlans = vlans.filter((v) => v.subnet.startsWith("172.16."));
  const otherVlans = vlans.filter((v) => !v.subnet.startsWith("172.16."));

  const totalDevices = Object.values(devices).reduce(
    (sum, arr) => sum + arr.filter((d) => d.device && d.device !== "GATEWAY" && d.device !== "BROADCAST" && d.device !== "DHCP").length,
    0
  );

  const handleAddVlan = async (vlan: VlanInfo) => {
    if (await addVlan(vlan)) {
      toast.success(`VLAN ${vlan.id} (${vlan.name}) added`);
      setVlanFormOpen(false);
    }
  };

  const renderVlanCard = (vlan: { id: number; name: string; subnet: string }) => {
    const allDevs = devices[vlan.id] || [];
    const devs = allDevs.filter(
      (d) => d.device && d.device !== "GATEWAY" && d.device !== "BROADCAST" && d.device !== "DHCP"
    );
    // Subnet utilization
    let usedCount = allDevs.length;
    let totalHosts = 0;
    let utilPct = 0;
    try {
      const { hostCount } = parseSubnet(vlan.subnet);
      totalHosts = hostCount - 2; // exclude network + broadcast
      utilPct = totalHosts > 0 ? Math.round((usedCount / totalHosts) * 100) : 0;
    } catch {}

    const utilColor = utilPct > 80 ? "bg-destructive" : utilPct > 50 ? "bg-amber-500" : "bg-emerald-500";

    return (
      <button
        key={vlan.id}
        onClick={() => navigate(`/vlan/${vlan.id}`)}
        className={`relative border rounded-lg p-4 text-left transition-all duration-200 ${vlanColorClasses[vlan.id] || defaultColorClass} cursor-pointer group`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={iconColorClasses[vlan.id] || defaultIconColor} onClick={(e) => e.stopPropagation()}>
            <IconPicker
              value={(vlans.find(v => v.id === vlan.id) as VlanInfo)?.icon || "Network"}
              onChange={(icon) => updateVlan(vlan.id, { icon })}
              className={iconColorClasses[vlan.id] || defaultIconColor}
            />
          </div>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${badgeColorClasses[vlan.id] || defaultBadgeColor}`}>
            VLAN {vlan.id}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-sm mb-1">{vlan.name}</h3>
        <p className="font-mono text-xs text-muted-foreground mb-2">{vlan.subnet}</p>
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{usedCount}/{totalHosts} IPs used</span>
            <span>{utilPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div className={`h-full rounded-full ${utilColor} transition-all`} style={{ width: `${Math.min(utilPct, 100)}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {devs.length} device{devs.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(devs.length, 8) }).map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${iconColorClasses[vlan.id] || defaultIconColor} opacity-70`} style={{ backgroundColor: "currentColor" }} />
            ))}
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Loading IPAM data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{settings.site_name}</h1>
              <p className="text-xs text-muted-foreground">IP Address Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <ImportExportButtons />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{totalDevices} devices</span>
                <span className="text-border">|</span>
                <span className="font-mono">{vlans.length} VLANs</span>
                <span className="text-border">|</span>
                <UserAvatarMenu />
              </div>
            </div>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden h-8 w-8 rounded-md bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card border-border w-72 p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Menu</h2>
                </div>
                <div className="p-4 space-y-1">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
                    <span className="font-mono">{totalDevices} devices</span>
                    <span className="text-border">·</span>
                    <span className="font-mono">{vlans.length} VLANs</span>
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="py-2">
                    <ImportExportButtons />
                  </div>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-2 w-full py-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 w-full py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Action bar */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setVlanFormOpen(true)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Add VLAN
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Menu className="h-4 w-4" /> Views
                {activeView && (
                  <span className="ml-1 text-xs text-primary font-medium">
                    ({activeView === "summary" ? "Summary" : activeView === "analytics" ? "Analytics" : "Audit Log"})
                  </span>
                )}
                <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => toggleView("summary")}>
                <List className="h-4 w-4 mr-2" /> VLAN Summary {activeView === "summary" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleView("analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" /> Analytics {activeView === "analytics" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleView("audit")}>
                <ScrollText className="h-4 w-4 mr-2" /> Audit Log {activeView === "audit" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/cables")}>
                <Cable className="h-4 w-4 mr-2" /> Cable Drops
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/pdu")}>
                <Plug className="h-4 w-4 mr-2" /> PDU
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/wireless")}>
                <Wifi className="h-4 w-4 mr-2" /> Wireless Networks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/rack")}>
                <Server className="h-4 w-4 mr-2" /> Server Rack
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/print")}>
                <Printer className="h-4 w-4 mr-2" /> Print IPAM
              </DropdownMenuItem>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4 mr-2" /> Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {THEMES.map((t) => (
                    <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)}>
                      {t.label} {theme === t.id && "✓"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {activeView === "summary" && (
          <div className="relative">
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => setActiveView(null)}>
              <X className="h-4 w-4" />
            </Button>
            <VlanSummaryTable />
          </div>
        )}
        {activeView === "analytics" && (
          <div className="relative">
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => setActiveView(null)}>
              <X className="h-4 w-4" />
            </Button>
            <DashboardAnalytics />
          </div>
        )}
        {activeView === "audit" && (
          <div className="relative">
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => setActiveView(null)}>
              <X className="h-4 w-4" />
            </Button>
            <AuditLogPanel />
          </div>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Home VLANs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {homeVlans.map(renderVlanCard)}
          </div>
        </section>

        {otherVlans.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Other Networks</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {otherVlans.map(renderVlanCard)}
            </div>
          </section>
        )}
      </main>

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VlanFormDialog open={vlanFormOpen} onClose={() => setVlanFormOpen(false)} onSave={handleAddVlan} />
    </div>
  );
}
