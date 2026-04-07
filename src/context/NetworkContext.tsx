import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DeviceEntry, VlanInfo } from "@/types/network";
import { findIpConflict, parseSubnet } from "@/data/networkData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface NetworkContextType {
  devices: Record<number, DeviceEntry[]>;
  vlans: VlanInfo[];
  loading: boolean;
  addDevice: (vlanId: number, device: DeviceEntry) => Promise<boolean>;
  updateDevice: (vlanId: number, device: DeviceEntry) => Promise<boolean>;
  deleteDevice: (vlanId: number, deviceId: string) => Promise<void>;
  updateVlan: (vlanId: number, updates: Partial<VlanInfo>) => Promise<void>;
  addVlan: (vlan: VlanInfo) => Promise<boolean>;
  deleteVlan: (vlanId: number) => Promise<void>;
  importData: (newVlans: VlanInfo[], newDevices: Record<number, DeviceEntry[]>) => Promise<void>;
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

async function logAudit(action: string, entityType: string, entityId: string, details: any, userId?: string, userEmail?: string) {
  await supabase.from("audit_log" as any).insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    performed_by: userId,
    performed_by_email: userEmail,
  } as any);
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<number, DeviceEntry[]>>({});
  const [vlans, setVlans] = useState<VlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    const [vlansRes, devicesRes] = await Promise.all([
      supabase.from("vlans" as any).select("*").order("vlan_id"),
      supabase.from("devices" as any).select("*").order("ip_address"),
    ]);

    if (vlansRes.data) {
      setVlans((vlansRes.data as any[]).map((v) => ({
        id: v.vlan_id,
        name: v.name,
        subnet: v.subnet,
        color: v.color,
        icon: v.icon || "Network",
      })));
    }

    if (devicesRes.data) {
      const grouped: Record<number, DeviceEntry[]> = {};
      for (const d of devicesRes.data as any[]) {
        if (!grouped[d.vlan_id]) grouped[d.vlan_id] = [];
        grouped[d.vlan_id].push({
          id: d.id,
          ipAddress: d.ip_address,
          device: d.device_name,
          brand: d.brand,
          model: d.model,
          docs: d.docs,
          location: d.location,
          notes: d.notes,
          status: d.status || "",
          updatedAt: d.updated_at,
        });
      }
      setDevices(grouped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const addDevice = useCallback(async (vlanId: number, device: DeviceEntry): Promise<boolean> => {
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, devices, vlans);
      if (conflict) {
        toast.error(`IP Conflict: ${device.ipAddress} already exists in VLAN ${conflict.vlanId} (${conflict.vlanName}) — assigned to "${conflict.device.device || "unnamed"}"`, { duration: 6000 });
        return false;
      }
    }
    const { error } = await supabase.from("devices" as any).insert({
      vlan_id: vlanId,
      ip_address: device.ipAddress,
      device_name: device.device,
      brand: device.brand,
      model: device.model,
      docs: device.docs,
      location: device.location,
      notes: device.notes,
      status: device.status || "",
    } as any);
    if (error) { toast.error(error.message); return false; }
    await logAudit("device_added", "device", device.ipAddress, { vlan_id: vlanId, device_name: device.device }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [devices, vlans, user, fetchAll]);

  const updateDevice = useCallback(async (vlanId: number, device: DeviceEntry): Promise<boolean> => {
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, devices, vlans, device.id);
      if (conflict) {
        toast.error(`IP Conflict: ${device.ipAddress} already exists in VLAN ${conflict.vlanId} (${conflict.vlanName}) — assigned to "${conflict.device.device || "unnamed"}"`, { duration: 6000 });
        return false;
      }
    }
    const { error } = await supabase.from("devices" as any).update({
      ip_address: device.ipAddress,
      device_name: device.device,
      brand: device.brand,
      model: device.model,
      docs: device.docs,
      location: device.location,
      notes: device.notes,
      status: device.status || "",
      updated_at: new Date().toISOString(),
    } as any).eq("id", device.id);
    if (error) { toast.error(error.message); return false; }
    await logAudit("device_updated", "device", device.ipAddress, { vlan_id: vlanId, device_name: device.device }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [devices, vlans, user, fetchAll]);

  const deleteDevice = useCallback(async (vlanId: number, deviceId: string) => {
    const dev = devices[vlanId]?.find((d) => d.id === deviceId);
    const { error } = await supabase.from("devices" as any).delete().eq("id", deviceId);
    if (error) { toast.error(error.message); return; }
    await logAudit("device_deleted", "device", dev?.ipAddress || deviceId, { vlan_id: vlanId, device_name: dev?.device }, user?.id, user?.email);
    await fetchAll();
  }, [devices, user, fetchAll]);

  const updateVlan = useCallback(async (vlanId: number, updates: Partial<VlanInfo>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.subnet !== undefined) dbUpdates.subnet = updates.subnet;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    dbUpdates.updated_at = new Date().toISOString();
    const { error } = await supabase.from("vlans" as any).update(dbUpdates).eq("vlan_id", vlanId);
    if (error) { toast.error(error.message); return; }
    await logAudit("vlan_updated", "vlan", String(vlanId), updates, user?.id, user?.email);
    await fetchAll();
  }, [user, fetchAll]);

  const addVlan = useCallback(async (vlan: VlanInfo): Promise<boolean> => {
    const exists = vlans.some((v) => v.id === vlan.id);
    if (exists) { toast.error(`VLAN ${vlan.id} already exists`); return false; }
    const { error } = await supabase.from("vlans" as any).insert({
      vlan_id: vlan.id,
      name: vlan.name,
      subnet: vlan.subnet,
      color: vlan.color,
    } as any);
    if (error) { toast.error(error.message); return false; }
    await logAudit("vlan_added", "vlan", String(vlan.id), { name: vlan.name, subnet: vlan.subnet }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [vlans, user, fetchAll]);

  const deleteVlan = useCallback(async (vlanId: number) => {
    const vlan = vlans.find((v) => v.id === vlanId);
    const { error } = await supabase.from("vlans" as any).delete().eq("vlan_id", vlanId);
    if (error) { toast.error(error.message); return; }
    await logAudit("vlan_deleted", "vlan", String(vlanId), { name: vlan?.name }, user?.id, user?.email);
    await fetchAll();
  }, [vlans, user, fetchAll]);

  const importData = useCallback(async (newVlans: VlanInfo[], newDevices: Record<number, DeviceEntry[]>) => {
    // Delete existing data
    await supabase.from("devices" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("vlans" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert new VLANs
    const vlanRows = newVlans.map((v) => ({
      vlan_id: v.id, name: v.name, subnet: v.subnet, color: v.color || "var(--vlan-infra)",
    }));
    await supabase.from("vlans" as any).insert(vlanRows as any);

    // Insert new devices
    const deviceRows: any[] = [];
    for (const [vid, devs] of Object.entries(newDevices)) {
      for (const d of devs) {
        deviceRows.push({
          vlan_id: Number(vid),
          ip_address: d.ipAddress,
          device_name: d.device,
          brand: d.brand,
          model: d.model,
          docs: d.docs,
          location: d.location,
          notes: d.notes,
        });
      }
    }
    if (deviceRows.length > 0) {
      await supabase.from("devices" as any).insert(deviceRows as any);
    }

    await logAudit("data_imported", "system", "import", {
      vlans: newVlans.length,
      devices: deviceRows.length,
    }, user?.id, user?.email);

    await fetchAll();
  }, [user, fetchAll]);

  return (
    <NetworkContext.Provider value={{ devices, vlans, loading, addDevice, updateDevice, deleteDevice, updateVlan, addVlan, deleteVlan, importData, refresh: fetchAll }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
