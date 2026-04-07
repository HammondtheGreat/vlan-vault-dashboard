import { useState } from "react";
import {
  Network, Server, Shield, Zap, HardDrive, MonitorSpeaker, Printer, Camera,
  Phone, Wifi, Globe, Activity, Monitor, Cpu, Database, Radio, Tv, Router,
  Smartphone, Laptop, Tablet, Lock, Eye, Cloud, Gamepad2, Music,
  Thermometer, Lightbulb, Fan, Plug
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const AVAILABLE_ICONS: Record<string, React.ReactNode> = {
  Network: <Network className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  HardDrive: <HardDrive className="h-5 w-5" />,
  MonitorSpeaker: <MonitorSpeaker className="h-5 w-5" />,
  Printer: <Printer className="h-5 w-5" />,
  Camera: <Camera className="h-5 w-5" />,
  Phone: <Phone className="h-5 w-5" />,
  Wifi: <Wifi className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Monitor: <Monitor className="h-5 w-5" />,
  Cpu: <Cpu className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  Radio: <Radio className="h-5 w-5" />,
  Tv: <Tv className="h-5 w-5" />,
  Router: <Router className="h-5 w-5" />,
  Smartphone: <Smartphone className="h-5 w-5" />,
  Laptop: <Laptop className="h-5 w-5" />,
  Tablet: <Tablet className="h-5 w-5" />,
  Lock: <Lock className="h-5 w-5" />,
  Eye: <Eye className="h-5 w-5" />,
  Cloud: <Cloud className="h-5 w-5" />,
  Gamepad2: <Gamepad2 className="h-5 w-5" />,
  Music: <Music className="h-5 w-5" />,
  Thermometer: <Thermometer className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  Fan: <Fan className="h-5 w-5" />,
  Plug: <Plug className="h-5 w-5" />,
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

export default function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className || ""}`} title="Change icon">
          {AVAILABLE_ICONS[value] || AVAILABLE_ICONS.Network}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover border-border p-2" align="start">
        <p className="text-xs text-muted-foreground mb-2 px-1">Choose an icon</p>
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(AVAILABLE_ICONS).map(([name, icon]) => (
            <button
              key={name}
              onClick={() => { onChange(name); setOpen(false); }}
              className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                value === name ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={name}
            >
              {icon}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
