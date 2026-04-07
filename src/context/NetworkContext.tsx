import React, { createContext, useContext, useState, useCallback } from "react";
import { DeviceEntry } from "@/types/network";
import { loadData, saveData } from "@/data/networkData";

interface NetworkContextType {
  devices: Record<number, DeviceEntry[]>;
  addDevice: (vlanId: number, device: DeviceEntry) => void;
  updateDevice: (vlanId: number, device: DeviceEntry) => void;
  deleteDevice: (vlanId: number, deviceId: string) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<number, DeviceEntry[]>>(loadData);

  const persist = useCallback((next: Record<number, DeviceEntry[]>) => {
    setDevices(next);
    saveData(next);
  }, []);

  const addDevice = useCallback((vlanId: number, device: DeviceEntry) => {
    setDevices((prev) => {
      const next = { ...prev, [vlanId]: [...(prev[vlanId] || []), device] };
      saveData(next);
      return next;
    });
  }, []);

  const updateDevice = useCallback((vlanId: number, device: DeviceEntry) => {
    setDevices((prev) => {
      const next = {
        ...prev,
        [vlanId]: (prev[vlanId] || []).map((d) => (d.id === device.id ? device : d)),
      };
      saveData(next);
      return next;
    });
  }, []);

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
