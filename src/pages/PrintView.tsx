import { useEffect } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintView() {
  const { vlans, devices } = useNetwork();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${settings.site_name} — Print View`;
  }, [settings.site_name]);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="mb-6 print:mb-4">
          <h1 className="text-2xl font-bold text-foreground print:text-black">{settings.site_name}</h1>
          <p className="text-sm text-muted-foreground print:text-gray-500">
            Generated {new Date().toLocaleDateString()} — {vlans.length} VLANs
          </p>
        </div>

        {vlans.map((vlan) => {
          const allDevs = devices[vlan.id] || [];
          const devs = allDevs.filter(
            (d) => d.device && d.device !== "BROADCAST" && d.device !== "DHCP"
          );

          if (devs.length === 0) return null;

          return (
            <div key={vlan.id} className="mb-6 print:mb-4 print:break-inside-avoid">
              <div className="flex items-baseline gap-2 mb-2 border-b-2 border-foreground/20 print:border-black/30 pb-1">
                <h2 className="text-lg font-bold text-foreground print:text-black">
                  VLAN {vlan.id} — {vlan.name}
                </h2>
                <span className="text-xs font-mono text-muted-foreground print:text-gray-500">
                  {vlan.subnet}
                </span>
                <span className="text-xs text-muted-foreground print:text-gray-500 ml-auto">
                  {devs.length} device{devs.length !== 1 ? "s" : ""}
                </span>
              </div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground print:text-gray-600 border-b border-border print:border-gray-300">
                    <th className="py-1.5 pr-3 font-medium">IP Address</th>
                    <th className="py-1.5 pr-3 font-medium">Device</th>
                    <th className="py-1.5 pr-3 font-medium">Brand</th>
                    <th className="py-1.5 pr-3 font-medium">Model</th>
                    <th className="py-1.5 pr-3 font-medium">Location</th>
                    <th className="py-1.5 pr-3 font-medium">Status</th>
                    <th className="py-1.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {devs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border/50 print:border-gray-200 text-foreground print:text-black"
                    >
                      <td className="py-1.5 pr-3 font-mono text-xs">{d.ipAddress}</td>
                      <td className="py-1.5 pr-3 font-medium">{d.device}</td>
                      <td className="py-1.5 pr-3">{d.brand || "—"}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs">{d.model || "—"}</td>
                      <td className="py-1.5 pr-3">{d.location || "—"}</td>
                      <td className="py-1.5 pr-3">{d.status || "—"}</td>
                      <td className="py-1.5 text-xs text-muted-foreground print:text-gray-500">{d.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
