import { useEffect, useState, useCallback } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RackItem {
  id: string;
  device_id: string | null;
  start_u: number;
  u_size: number;
  label: string;
  notes: string;
}

interface RackDevice {
  id: string;
  device_name: string;
  brand: string;
  model: string;
  ip_address: string;
}

const TOTAL_U = 22;

export default function PrintView() {
  const { vlans, devices } = useNetwork();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [rackItems, setRackItems] = useState<RackItem[]>([]);
  const [rackDevices, setRackDevices] = useState<RackDevice[]>([]);
  const [cableDrops, setCableDrops] = useState<CableDrop[]>([]);
  const [pduOutlets, setPduOutlets] = useState<PduOutlet[]>([]);

  useEffect(() => {
    document.title = `${settings.site_name} — Print View`;
  }, [settings.site_name]);

  const fetchExtraData = useCallback(async () => {
    const [rackRes, devRes, cableRes, pduRes] = await Promise.all([
      supabase.from("rack_items" as any).select("*").order("start_u"),
      supabase.from("devices").select("id, device_name, brand, model, ip_address"),
      supabase.from("cable_drops" as any).select("*").order("sort_order"),
      supabase.from("pdu_outlets" as any).select("*").order("outlet_number"),
    ]);
    if (rackRes.data) setRackItems(rackRes.data as any);
    if (devRes.data) setRackDevices(devRes.data as RackDevice[]);
    if (cableRes.data) setCableDrops(cableRes.data as any);
    if (pduRes.data) setPduOutlets(pduRes.data as any);
  }, []);

  useEffect(() => { fetchExtraData(); }, [fetchExtraData]);

  const handlePrint = () => window.print();

  // Build rack slot map
  const occupiedSlots = new Map<number, RackItem>();
  for (const item of rackItems) {
    for (let u = item.start_u; u < item.start_u + item.u_size; u++) {
      occupiedSlots.set(u, item);
    }
  }

  const getDeviceForItem = (item: RackItem) =>
    item.device_id ? rackDevices.find((d) => d.id === item.device_id) : null;

  // Build rack rows for print
  const rackRows: { u: number; item: RackItem | null; isStart: boolean }[] = [];
  for (let u = TOTAL_U; u >= 1; u--) {
    const item = occupiedSlots.get(u) || null;
    const isStart = item ? item.start_u === u : false;
    rackRows.push({ u, item, isStart });
  }

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

        {/* VLAN sections */}
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

        {/* 22U Rack Layout */}
        <div className="mt-10 print:mt-6 print:break-before-page">
          <div className="flex items-baseline gap-2 mb-3 border-b-2 border-foreground/20 print:border-black/30 pb-1">
            <h2 className="text-lg font-bold text-foreground print:text-black">22U Server Rack</h2>
            <span className="text-xs text-muted-foreground print:text-gray-500 ml-auto">
              {rackItems.length} item{rackItems.length !== 1 ? "s" : ""} installed
            </span>
          </div>

          <table className="w-full text-sm border-collapse border border-border print:border-gray-400">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground print:text-gray-600 bg-muted/30 print:bg-gray-100">
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300 w-12 text-center">U</th>
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300">Device / Label</th>
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300">Size</th>
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300">Brand / Model</th>
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300">IP</th>
                <th className="py-1.5 px-2 font-medium border border-border print:border-gray-300">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rackRows.map(({ u, item, isStart }) => {
                // Skip non-start rows of multi-U items
                if (item && !isStart) return null;

                const device = item ? getDeviceForItem(item) : null;
                const isBlank = item && !item.device_id;

                return (
                  <tr
                    key={u}
                    className={`border border-border print:border-gray-300 text-foreground print:text-black ${
                      isBlank ? "bg-muted/20 print:bg-gray-50" : ""
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center font-mono text-xs border-r border-border print:border-gray-300">
                      {item && item.u_size > 1 ? `${u}–${u + item.u_size - 1}` : u}
                    </td>
                    <td className="py-1.5 px-2 font-medium">
                      {item
                        ? device
                          ? device.device_name
                          : item.label || "(blank)"
                        : <span className="text-muted-foreground print:text-gray-400 italic">empty</span>
                      }
                    </td>
                    <td className="py-1.5 px-2 font-mono text-xs">
                      {item ? `${item.u_size}U` : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-xs">
                      {device ? `${device.brand} ${device.model}`.trim() || "—" : "—"}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-xs">
                      {device ? device.ip_address : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground print:text-gray-500">
                      {item?.notes || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
