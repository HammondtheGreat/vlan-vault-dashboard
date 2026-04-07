import React, { createContext, useContext, useState, useCallback } from "react";
import { DeviceEntry } from "@/types/network";
import { loadData, saveData, findIpConflict, vlans } from "@/data/networkData";
import { toast } from "sonner";

interface NetworkContextType {
  devices: Record<number, DeviceEntry[]>;
  addDevice: (vlanId: number, device: DeviceEntry) => boolean;
  updateDevice: (vlanId: number, device: DeviceEntry) => boolean;
  deleteDevice: (vlanId: number, deviceId: string) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<number, DeviceEntry[]>>(loadData);

  const addDevice = useCallback((vlanId: number, device: DeviceEntry): boolean => {
    const current = devices;
    // Conflict check
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, current);
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
  }, [devices]);

  const updateDevice = useCallback((vlanId: number, device: DeviceEntry): boolean => {
    const current = devices;
    // Conflict check (exclude the device being edited)
    if (device.ipAddress) {
      const conflict = findIpConflict(device.ipAddress, current, device.id);
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
  }, [devices]);

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

  return (
    <NetworkContext.Provider value={{ devices, addDevice, updateDevice, deleteDevice }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
