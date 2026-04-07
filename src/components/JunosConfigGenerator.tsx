import { useState } from "react";
import { VlanInfo } from "@/types/network";
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function generateJunosConfig(vlan: VlanInfo): string {
  const subnetParts = vlan.subnet.split("/");
  const baseIp = subnetParts[0];
  const cidr = subnetParts[1];
  const octets = baseIp.split(".");
  // Gateway is .1 in the subnet
  const gatewayIp = `${octets[0]}.${octets[1]}.${octets[2]}.1`;

  return [
    `# ──────────────────────────────────────────────`,
    `# Juniper QFX5100 — VLAN ${vlan.id} (${vlan.name})`,
    `# Generated: ${new Date().toISOString().split("T")[0]}`,
    `# ──────────────────────────────────────────────`,
    ``,
    `# VLAN Configuration`,
    `set vlans ${vlan.name.replace(/[\s/]+/g, "_")} vlan-id ${vlan.id}`,
    `set vlans ${vlan.name.replace(/[\s/]+/g, "_")} description "${vlan.name} — ${vlan.subnet}"`,
    `set vlans ${vlan.name.replace(/[\s/]+/g, "_")} l3-interface irb.${vlan.id}`,
    ``,
    `# L3 IRB Interface`,
    `set interfaces irb unit ${vlan.id} family inet address ${gatewayIp}/${cidr}`,
    `set interfaces irb unit ${vlan.id} description "Gateway for VLAN ${vlan.id} — ${vlan.name}"`,
    ``,
    `# Trunk Port Assignment (adjust ge-0/0/X as needed)`,
    `set interfaces ge-0/0/0 unit 0 family ethernet-switching vlan members ${vlan.name.replace(/[\s/]+/g, "_")}`,
    ``,
    `# Security Zone Binding`,
    `set security zones security-zone trust interfaces irb.${vlan.id}`,
  ].join("\n");
}

export default function JunosConfigGenerator({ vlan }: { vlan: VlanInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = generateJunosConfig(vlan);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    toast.success("Config copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-foreground">Junos Config Generator</span>
            <p className="text-[11px] text-muted-foreground">QFX5100 set commands</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="gap-1.5 h-7 text-xs border-border hover:border-emerald-500/40 hover:text-emerald-400"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-[hsl(220,20%,5%)] p-4 overflow-x-auto">
          <pre className="font-['JetBrains_Mono'] text-xs leading-relaxed whitespace-pre">
            {config.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 shrink-0 text-right pr-3 select-none text-muted-foreground/40 text-[10px] leading-relaxed">
                  {i + 1}
                </span>
                <span
                  className={
                    line.startsWith("#")
                      ? "text-muted-foreground"
                      : line.startsWith("set")
                        ? "text-emerald-400"
                        : "text-foreground"
                  }
                >
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
