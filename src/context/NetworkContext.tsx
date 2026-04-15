import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DeviceEntry, VlanInfo } from "@/types/network";
import { findIpConflict, parseSubnet, ipToNum, numToIp } from "@/data/networkData";
import * as api from "@/api/client";
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
  await api.createAuditEntry({
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    performed_by: userId,
    performed_by_email: userEmail,
  });
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<number, DeviceEntry[]>>({});
  const [vlans, setVlans] = useState<VlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    const [vlansRes, devicesRes] = await Promise.all([
      api.getVlans(),
      api.getDevices(),
    ]);

    if (vlansRes.data) {
      setVlans(vlansRes.data.map((v) => ({
        id: v.vlan_id,
        name: v.name,
        subnet: v.subnet,
        color: v.color,
        icon: v.icon || "Network",
      })));
    }

    if (devicesRes.data) {
      const grouped: Record<number, DeviceEntry[]> = {};
      for (const d of devicesRes.data) {
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
    const { error } = await api.createDevice({
      vlan_id: vlanId,
      ip_address: device.ipAddress,
      device_name: device.device,
      brand: device.brand,
      model: device.model,
      docs: device.docs,
      location: device.location,
      notes: device.notes,
      status: device.status || "",
    });
    if (error) { toast.error(error.message); return false; }
    await logAudit("device_added", "device", device.ipAddress, { vlan_id: vlanId, device_name: device.device }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [devices, vlans, user, fetchAll]);

  const updateDeviceHandler = useCallback(async (vlanId: number, device: DeviceEntry): Promise<boolean> => {
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, devices, vlans, device.id);
      if (conflict) {
        toast.error(`IP Conflict: ${device.ipAddress} already exists in VLAN ${conflict.vlanId} (${conflict.vlanName}) — assigned to "${conflict.device.device || "unnamed"}"`, { duration: 6000 });
        return false;
      }
    }
    const { error } = await api.updateDevice(device.id, {
      ip_address: device.ipAddress,
      device_name: device.device,
      brand: device.brand,
      model: device.model,
      docs: device.docs,
      location: device.location,
      notes: device.notes,
      status: device.status || "",
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return false; }
    await logAudit("device_updated", "device", device.ipAddress, { vlan_id: vlanId, device_name: device.device }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [devices, vlans, user, fetchAll]);

  const deleteDeviceHandler = useCallback(async (vlanId: number, deviceId: string) => {
    const dev = devices[vlanId]?.find((d) => d.id === deviceId);
    const { error } = await api.deleteDevice(deviceId);
    if (error) { toast.error(error.message); return; }
    await logAudit("device_deleted", "device", dev?.ipAddress || deviceId, { vlan_id: vlanId, device_name: dev?.device }, user?.id, user?.email);
    await fetchAll();
  }, [devices, user, fetchAll]);

  const updateVlanHandler = useCallback(async (vlanId: number, updates: Partial<VlanInfo>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.subnet !== undefined) dbUpdates.subnet = updates.subnet;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    dbUpdates.updated_at = new Date().toISOString();

    // Handle VLAN ID change
    if (updates.id !== undefined && updates.id !== vlanId) {
      const newId = updates.id;
      const exists = vlans.some((v) => v.id === newId);
      if (exists) { toast.error(`VLAN ${newId} already exists`); return; }
      dbUpdates.vlan_id = newId;
      await api.updateDevicesByVlan(vlanId, { vlan_id: newId } as any);
    }

    // Handle subnet change — remap device IPs
    if (updates.subnet !== undefined) {
      const oldVlan = vlans.find((v) => v.id === vlanId);
      if (oldVlan && oldVlan.subnet !== updates.subnet) {
        try {
          const oldParsed = parseSubnet(oldVlan.subnet);
          const newParsed = parseSubnet(updates.subnet);
          const oldBaseNum = ipToNum(oldParsed.base.join("."));
          const newBaseNum = ipToNum(newParsed.base.join("."));
          const vlanDevices = devices[vlanId] || [];
          for (const dev of vlanDevices) {
            if (dev.ipAddress) {
              const devNum = ipToNum(dev.ipAddress);
              const offset = devNum - oldBaseNum;
              if (offset >= 0 && offset < newParsed.hostCount) {
                const newIp = numToIp(newBaseNum + offset);
                await api.updateDevice(dev.id, { ip_address: newIp });
              }
            }
          }
        } catch {}
      }
    }

    const { error } = await api.updateVlan(vlanId, dbUpdates);
    if (error) { toast.error(error.message); return; }
    await logAudit("vlan_updated", "vlan", String(vlanId), updates, user?.id, user?.email);
    await fetchAll();
  }, [vlans, devices, user, fetchAll]);

  const addVlanHandler = useCallback(async (vlan: VlanInfo): Promise<boolean> => {
    const exists = vlans.some((v) => v.id === vlan.id);
    if (exists) { toast.error(`VLAN ${vlan.id} already exists`); return false; }
    const { error } = await api.createVlan({
      vlan_id: vlan.id,
      name: vlan.name,
      subnet: vlan.subnet,
      color: vlan.color,
      icon: vlan.icon || "Network",
    });
    if (error) { toast.error(error.message); return false; }
    await logAudit("vlan_added", "vlan", String(vlan.id), { name: vlan.name, subnet: vlan.subnet }, user?.id, user?.email);
    await fetchAll();
    return true;
  }, [vlans, user, fetchAll]);

  const deleteVlanHandler = useCallback(async (vlanId: number) => {
    const vlan = vlans.find((v) => v.id === vlanId);
    const { error } = await api.deleteVlan(vlanId);
    if (error) { toast.error(error.message); return; }
    await logAudit("vlan_deleted", "vlan", String(vlanId), { name: vlan?.name }, user?.id, user?.email);
    await fetchAll();
  }, [vlans, user, fetchAll]);

  const importData = useCallback(async (newVlans: VlanInfo[], newDevices: Record<number, DeviceEntry[]>) => {
    await api.deleteAllDevices();
    await api.deleteAllVlans();

    const vlanRows = newVlans.map((v) => ({
      vlan_id: v.id, name: v.name, subnet: v.subnet, color: v.color || "var(--vlan-infra)", icon: v.icon || "Network",
    }));
    await api.bulkInsertVlans(vlanRows);

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
          status: d.status || "",
        });
      }
    }
    if (deviceRows.length > 0) {
      await api.bulkInsertDevices(deviceRows);
    }

    await logAudit("data_imported", "system", "import", {
      vlans: newVlans.length,
      devices: deviceRows.length,
    }, user?.id, user?.email);

    await fetchAll();
  }, [user, fetchAll]);

  return (
    <NetworkContext.Provider value={{ devices, vlans, loading, addDevice, updateDevice: updateDeviceHandler, deleteDevice: deleteDeviceHandler, updateVlan: updateVlanHandler, addVlan: addVlanHandler, deleteVlan: deleteVlanHandler, importData, refresh: fetchAll }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
