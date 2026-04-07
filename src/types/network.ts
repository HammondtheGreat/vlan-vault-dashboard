export interface VlanInfo {
  id: number;
  name: string;
  subnet: string;
  color: string;
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
}

export interface VlanData {
  vlan: VlanInfo;
  devices: DeviceEntry[];
}
