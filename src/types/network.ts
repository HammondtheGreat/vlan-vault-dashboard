export interface VlanInfo {
  id: number;
  name: string;
  subnet: string;
  color: string;
  icon?: string;
}

export interface DeviceEntry {
  id: string;
  ipAddress: string;
  device: string;
  brand: string;
  model: string;
  docs: string;
  location: string;
  notes: string;
  status: string;
  updatedAt?: string;
}

export type DeviceStatus = "" | "In Use" | "Future" | "Reserved" | "Bad";

export const DEVICE_STATUSES: DeviceStatus[] = ["", "In Use", "Future", "Reserved", "Bad"];

export interface VlanData {
  vlan: VlanInfo;
  devices: DeviceEntry[];
}
