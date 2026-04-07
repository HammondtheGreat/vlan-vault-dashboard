import { useMemo } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { parseSubnet, isStale } from "@/data/networkData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const COLORS = [
  "hsl(var(--primary))", "#ef4444", "#f59e0b", "#06b6d4", "#a855f7",
  "#22c55e", "#3b82f6", "#ec4899", "#f97316", "#14b8a6",
  "#e11d48", "#0ea5e9", "#8b5cf6",
];

export default function DashboardAnalytics() {
  const { vlans, devices } = useNetwork();

  const stats = useMemo(() => {
    let totalDevices = 0;
    let totalCapacity = 0;
    let staleCount = 0;
    const distribution: { name: string; devices: number; capacity: number; used: number }[] = [];

    for (const vlan of vlans) {
      const devs = devices[vlan.id] || [];
      const realDevices = devs.filter((d) => d.device && !["GATEWAY", "BROADCAST", "DHCP"].includes(d.device));
      totalDevices += realDevices.length;
      staleCount += realDevices.filter((d) => isStale(d)).length;

      let capacity = 0;
      try { capacity = parseSubnet(vlan.subnet).hostCount - 2; } catch {}
      totalCapacity += capacity;

      distribution.push({
        name: `V${vlan.id}`,
        devices: devs.length,
        capacity,
        used: capacity > 0 ? Math.round((devs.length / capacity) * 100) : 0,
      });
    }

    const brandMap: Record<string, number> = {};
    for (const devs of Object.values(devices)) {
      for (const d of devs) {
        if (d.brand) brandMap[d.brand] = (brandMap[d.brand] || 0) + 1;
      }
    }
    const brands = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return { totalDevices, totalCapacity, staleCount, distribution, brands, totalUsed: Object.values(devices).reduce((s, d) => s + d.length, 0) };
  }, [vlans, devices]);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Dashboard Analytics</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Devices" value={stats.totalDevices} />
        <StatCard label="Total VLANs" value={vlans.length} />
        <StatCard label="Overall Utilization" value={`${stats.totalCapacity > 0 ? Math.round((stats.totalUsed / stats.totalCapacity) * 100) : 0}%`} />
        <StatCard label="Stale Devices" value={stats.staleCount} warn={stats.staleCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subnet utilization chart */}
        <div className="rounded-lg border border-border bg-card/80 p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Subnet Utilization %</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.distribution}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="used" name="Used %" radius={[4, 4, 0, 0]}>
                {stats.distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Brand distribution */}
        <div className="rounded-lg border border-border bg-card/80 p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Devices by Brand</h3>
          {stats.brands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No brand data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.brands} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: "hsl(var(--muted-foreground))" }}>
                  {stats.brands.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Device count per VLAN */}
      <div className="rounded-lg border border-border bg-card/80 p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Devices per VLAN</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.distribution}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="devices" name="Devices" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${warn ? "text-amber-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
