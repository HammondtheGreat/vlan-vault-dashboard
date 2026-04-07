import { VlanInfo, DeviceEntry } from "@/types/network";

export const defaultVlans: VlanInfo[] = [
  { id: 100, name: "Firewall", subnet: "172.16.100.0/25", color: "var(--vlan-firewall)" },
  { id: 101, name: "Power", subnet: "172.16.101.0/25", color: "var(--vlan-power)" },
  { id: 102, name: "Infrastructure", subnet: "172.16.102.0/25", color: "var(--vlan-infra)" },
  { id: 103, name: "Storage", subnet: "172.16.103.0/25", color: "var(--vlan-storage)" },
  { id: 104, name: "Virtualization", subnet: "172.16.104.0/25", color: "var(--vlan-virt)" },
  { id: 105, name: "Servers", subnet: "172.16.105.0/25", color: "var(--vlan-servers)" },
  { id: 106, name: "KVM", subnet: "172.16.106.0/25", color: "var(--vlan-kvm)" },
  { id: 107, name: "Printers/Scanners", subnet: "172.16.107.0/25", color: "var(--vlan-printers)" },
  { id: 108, name: "Cameras", subnet: "172.16.108.0/25", color: "var(--vlan-cameras)" },
  { id: 109, name: "Telecom", subnet: "172.16.109.0/25", color: "var(--vlan-telecom)" },
  { id: 110, name: "Warp 9 Net", subnet: "172.16.110.0/25", color: "var(--vlan-warp9)" },
  { id: 111, name: "No Mold Net", subnet: "172.16.111.0/25", color: "var(--vlan-infra)" },
  { id: 112, name: "DMZ", subnet: "192.168.50.0/25", color: "var(--vlan-firewall)" },
];

// Keep backward compat alias
export const vlans = defaultVlans;

let counter = 0;
const uid = () => `dev-${++counter}`;
const now = () => new Date().toISOString();

function makeDevices(_vlanId: number, entries: Partial<DeviceEntry>[]): DeviceEntry[] {
  return entries.map((e) => ({
    id: uid(),
    ipAddress: e.ipAddress || "",
    device: e.device || "",
    brand: e.brand || "",
    model: e.model || "",
    docs: e.docs || "",
    location: e.location || "",
    notes: e.notes || "",
    status: e.status || "",
    updatedAt: e.updatedAt || now(),
  }));
}

const initialDevices: Record<number, DeviceEntry[]> = {
  100: makeDevices(100, [
    { ipAddress: "172.16.100.1", device: "firewall-mdf", brand: "Netgate", model: "XG-1537", location: "Garage" },
  ]),
  101: makeDevices(101, [
    { ipAddress: "172.16.101.1", device: "GATEWAY" },
    { ipAddress: "172.16.101.2", device: "ups-mdf", brand: "CyberPower", model: "PR3000RTXL2UAC" },
    { ipAddress: "172.16.101.3", device: "pdu-mdf", brand: "CyberPower", model: "PDU41003" },
  ]),
  102: makeDevices(102, [
    { ipAddress: "172.16.102.1", device: "GATEWAY" },
    { ipAddress: "172.16.102.2", device: "firewall-mdf", brand: "Netgate", model: "XG-1537" },
    { ipAddress: "172.16.102.3", device: "sw-mdf-core", brand: "Juniper", model: "QFX5100-48S-3AFO" },
    { ipAddress: "172.16.102.4", device: "sw-mdf-access", brand: "Juniper", model: "EX4300-48MP" },
    { ipAddress: "172.16.102.10", device: "ap-front", brand: "Ruckus", model: "R650" },
    { ipAddress: "172.16.102.11", device: "ap-back", brand: "Ruckus", model: "R650" },
  ]),
  103: makeDevices(103, [
    { ipAddress: "172.16.103.1", device: "GATEWAY" },
    { ipAddress: "172.16.103.2", device: "warp9-storage", brand: "iXsystems", model: "TrueNAS-Mini-R" },
  ]),
  104: makeDevices(104, [
    { ipAddress: "172.16.104.1", device: "GATEWAY" },
    { ipAddress: "172.16.104.2", device: "host-01", notes: "Proxmox" },
  ]),
  105: makeDevices(105, [
    { ipAddress: "172.16.105.1", device: "GATEWAY" },
    { ipAddress: "172.16.105.2", device: "warp9-pihole" },
    { ipAddress: "172.16.105.3", device: "warp9-4" },
    { ipAddress: "172.16.105.4", device: "warp9-ddclient" },
    { ipAddress: "172.16.105.5", device: "warp9-sync" },
    { ipAddress: "172.16.105.6", device: "warp9-mdns" },
    { ipAddress: "172.16.105.7", device: "warp9-syslog" },
    { ipAddress: "172.16.105.8", device: "warp9-cameras" },
    { ipAddress: "172.16.105.9", device: "warp9-entertainment" },
    { ipAddress: "172.16.105.10", device: "warp9-print" },
  ]),
  106: makeDevices(106, [
    { ipAddress: "172.16.106.1", device: "GATEWAY" },
    { ipAddress: "172.16.106.2", device: "warp9-pihole" },
    { ipAddress: "172.16.106.3", device: "warp9-4" },
    { ipAddress: "172.16.106.4", device: "warp9-ddclient" },
    { ipAddress: "172.16.106.5", device: "warp9-sync" },
    { ipAddress: "172.16.106.6", device: "warp9-mdns" },
    { ipAddress: "172.16.106.7", device: "warp9-syslog" },
    { ipAddress: "172.16.106.8", device: "warp9-cameras" },
    { ipAddress: "172.16.106.9", device: "warp9-entertainment" },
    { ipAddress: "172.16.106.10", device: "warp9-print" },
  ]),
  107: makeDevices(107, [
    { ipAddress: "172.16.107.1", device: "GATEWAY" },
    { ipAddress: "172.16.107.2", device: "printer-9015", brand: "HP", model: "OfficeJet Pro 9015", docs: "📖", location: "House" },
    { ipAddress: "172.16.107.3", device: "scanner-brother", brand: "Brother", model: "Image Center ADS-2800W", docs: "📖", location: "House" },
  ]),
  108: makeDevices(108, [
    { ipAddress: "172.16.108.1", device: "GATEWAY" },
    { ipAddress: "172.16.108.2", device: "cam-01", brand: "Hikvision", model: "DS-2CD2387G2-LSU/SL" },
    { ipAddress: "172.16.108.3", device: "cam-02", brand: "Hikvision" },
    { ipAddress: "172.16.108.4", device: "cam-03", brand: "Hikvision" },
    { ipAddress: "172.16.108.5", device: "cam-04", brand: "Hikvision" },
    { ipAddress: "172.16.108.6", device: "cam-05", brand: "Hikvision" },
    { ipAddress: "172.16.108.7", device: "cam-06", brand: "Hikvision" },
    { ipAddress: "172.16.108.8", device: "cam-07", brand: "Hikvision" },
  ]),
  109: makeDevices(109, [
    { ipAddress: "172.16.109.1", device: "GATEWAY" },
    { ipAddress: "172.16.109.2", device: "IP Phone", brand: "Yealink", model: "SIP-T58", docs: "📖", location: "House" },
  ]),
  110: makeDevices(110, [
    { ipAddress: "172.16.110.1", device: "GATEWAY" },
    { ipAddress: "172.16.110.2", device: "warp9-dt-home" },
    { ipAddress: "172.16.110.3", device: "warp9-lt-origin" },
    { ipAddress: "172.16.110.50", device: "DHCP" },
    { ipAddress: "172.16.110.128", device: "BROADCAST" },
  ]),
  111: makeDevices(111, [
    { ipAddress: "172.16.111.1", device: "GATEWAY" },
  ]),
  112: makeDevices(112, []),
};

const STORAGE_KEY = "warp9net-ipam-data";
const VLANS_STORAGE_KEY = "warp9net-vlans";

export function loadData(): Record<number, DeviceEntry[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...initialDevices };
}

export function saveData(data: Record<number, DeviceEntry[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadVlans(): VlanInfo[] {
  try {
    const stored = localStorage.getItem(VLANS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...defaultVlans];
}

export function saveVlans(vlans: VlanInfo[]) {
  localStorage.setItem(VLANS_STORAGE_KEY, JSON.stringify(vlans));
}

export function getVlanById(id: number): VlanInfo | undefined {
  return defaultVlans.find((v) => v.id === id);
}

/** Parse subnet string like "172.16.100.0/25" into base IP parts and host count */
export function parseSubnet(subnet: string): { base: number[]; prefix: number; hostCount: number } {
  const [ip, mask] = subnet.split("/");
  const parts = ip.split(".").map(Number);
  const prefix = Number(mask);
  const hostCount = Math.pow(2, 32 - prefix);
  return { base: parts, prefix, hostCount };
}

/** Convert IP string to a 32-bit number */
export function ipToNum(ip: string): number {
  const p = ip.split(".").map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

/** Convert 32-bit number back to IP string */
export function numToIp(num: number): string {
  return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join(".");
}

/** Find the next available IP in a subnet given existing devices */
export function findNextAvailableIp(subnet: string, existingDevices: DeviceEntry[]): string | null {
  const { base, hostCount } = parseSubnet(subnet);
  const baseNum = ipToNum(base.join("."));
  const usedIps = new Set(existingDevices.map((d) => d.ipAddress));

  // Skip .0 (network) and start from .2 (skip .1 gateway typically)
  for (let i = 2; i < hostCount - 1; i++) {
    const candidate = numToIp(baseNum + i);
    if (!usedIps.has(candidate)) return candidate;
  }
  return null;
}

/** Check if an IP exists in any VLAN across the entire dataset */
export function findIpConflict(
  ip: string,
  devices: Record<number, DeviceEntry[]>,
  allVlans: VlanInfo[],
  excludeDeviceId?: string
): { vlanId: number; vlanName: string; device: DeviceEntry } | null {
  for (const vlan of allVlans) {
    const devs = devices[vlan.id] || [];
    for (const d of devs) {
      if (d.ipAddress === ip && d.id !== excludeDeviceId) {
        return { vlanId: vlan.id, vlanName: vlan.name, device: d };
      }
    }
  }
  return null;
}

/** Check if a device entry is stale (not updated in 30 days) */
export function isStale(device: DeviceEntry): boolean {
  if (!device.updatedAt) return true;
  const updated = new Date(device.updatedAt).getTime();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return updated < thirtyDaysAgo;
}
