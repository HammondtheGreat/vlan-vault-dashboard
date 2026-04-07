import React, { createContext, useContext, useState, useCallback } from "react";
import { DeviceEntry, VlanInfo } from "@/types/network";
import { loadData, saveData, loadVlans, saveVlans, findIpConflict } from "@/data/networkData";
import { toast } from "sonner";

interface NetworkContextType {
  devices: Record<number, DeviceEntry[]>;
  vlans: VlanInfo[];
  addDevice: (vlanId: number, device: DeviceEntry) => boolean;
  updateDevice: (vlanId: number, device: DeviceEntry) => boolean;
  deleteDevice: (vlanId: number, deviceId: string) => void;
  updateVlan: (vlanId: number, updates: Partial<VlanInfo>) => void;
  addVlan: (vlan: VlanInfo) => boolean;
  deleteVlan: (vlanId: number) => void;
  importData: (newVlans: VlanInfo[], newDevices: Record<number, DeviceEntry[]>) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<number, DeviceEntry[]>>(loadData);
  const [vlans, setVlans] = useState<VlanInfo[]>(loadVlans);

  const addDevice = useCallback((vlanId: number, device: DeviceEntry): boolean => {
    const current = devices;
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, current, vlans);
      if (conflict) {
        toast.error(`IP Conflict: ${device.ipAddress} already exists in VLAN ${conflict.vlanId} (${conflict.vlanName}) — assigned to "${conflict.device.device || "unnamed"}"`, { duration: 6000 });
        return false;
      }
    }
    const stamped = { ...device, updatedAt: new Date().toISOString() };
    setDevices((prev) => {
      const next = { ...prev, [vlanId]: [...(prev[vlanId] || []), stamped] };
      saveData(next);
      return next;
    });
    return true;
  }, [devices, vlans]);

  const updateDevice = useCallback((vlanId: number, device: DeviceEntry): boolean => {
    const current = devices;
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, current, vlans, device.id);
      if (conflict) {
        toast.error(`IP Conflict: ${device.ipAddress} already exists in VLAN ${conflict.vlanId} (${conflict.vlanName}) — assigned to "${conflict.device.device || "unnamed"}"`, { duration: 6000 });
        return false;
      }
    }
    const stamped = { ...device, updatedAt: new Date().toISOString() };
    setDevices((prev) => {
      const next = {
        ...prev,
        [vlanId]: (prev[vlanId] || []).map((d) => (d.id === device.id ? stamped : d)),
      };
      saveData(next);
      return next;
    });
    return true;
  }, [devices, vlans]);

  const deleteDevice = useCallback((vlanId: number, deviceId: string) => {
    setDevices((prev) => {
      const next = {
        ...prev,
        [vlanId]: (prev[vlanId] || []).filter((d) => d.id !== deviceId),
      };
      saveData(next);
      return next;
    });
  }, []);

  const updateVlan = useCallback((vlanId: number, updates: Partial<VlanInfo>) => {
    setVlans((prev) => {
      const next = prev.map((v) => (v.id === vlanId ? { ...v, ...updates } : v));
      saveVlans(next);
      return next;
    });
  }, []);

  const addVlan = useCallback((vlan: VlanInfo): boolean => {
    const exists = vlans.some((v) => v.id === vlan.id);
    if (exists) {
      toast.error(`VLAN ${vlan.id} already exists`);
      return false;
    }
    setVlans((prev) => {
      const next = [...prev, vlan].sort((a, b) => a.id - b.id);
      saveVlans(next);
      return next;
    });
    setDevices((prev) => {
      const next = { ...prev, [vlan.id]: [] };
      saveData(next);
      return next;
    });
    return true;
  }, [vlans]);

  const deleteVlan = useCallback((vlanId: number) => {
    setVlans((prev) => {
      const next = prev.filter((v) => v.id !== vlanId);
      saveVlans(next);
      return next;
    });
    setDevices((prev) => {
      const { [vlanId]: _, ...next } = prev;
      saveData(next);
      return next;
    });
  }, []);

  const importData = useCallback((newVlans: VlanInfo[], newDevices: Record<number, DeviceEntry[]>) => {
    setVlans(() => {
      const sorted = [...newVlans].sort((a, b) => a.id - b.id);
      saveVlans(sorted);
      return sorted;
    });
    setDevices(() => {
      saveData(newDevices);
      return newDevices;
    });
  }, []);

  return (
    <NetworkContext.Provider value={{ devices, vlans, addDevice, updateDevice, deleteDevice, updateVlan, addVlan, deleteVlan, importData }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
