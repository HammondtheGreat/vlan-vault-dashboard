import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Server, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface RackItem {
  id: string;
  device_id: string | null;
  start_u: number;
  u_size: number;
  label: string;
  notes: string;
}

interface Device {
  id: string;
  device_name: string;
  brand: string;
  model: string;
  ip_address: string;
  vlan_id: number;
}

const U_SIZE_COLORS: Record<number, string> = {
  1: "bg-primary/20 border-primary/40",
  2: "bg-blue-500/20 border-blue-500/40",
  3: "bg-purple-500/20 border-purple-500/40",
  4: "bg-amber-500/20 border-amber-500/40",
  5: "bg-green-500/20 border-green-500/40",
};

interface DraggableRackItemProps {
  item: RackItem;
  device: Device | undefined;
  onClick: () => void;
}

export function DraggableRackItem({ item, device, onClick }: DraggableRackItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const colorClass = U_SIZE_COLORS[item.u_size] || U_SIZE_COLORS[1];

  const style: React.CSSProperties = {
    height: `${item.u_size * 40}px`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-md flex items-center gap-2 px-2 group cursor-pointer transition-colors hover:brightness-125",
        colorClass
      )}
      style={style}
    >
      <button
        {...listeners}
        {...attributes}
        className="touch-none p-1 text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
        U{item.start_u}{item.u_size > 1 ? `–${item.start_u + item.u_size - 1}` : ""}
      </span>
      <Server className="h-4 w-4 text-foreground/70 shrink-0" />
      <div className="flex-1 min-w-0" onClick={onClick}>
        <span className="text-sm font-medium text-foreground truncate block">
          {item.label || "Unnamed"}
        </span>
        {device && (
          <span className="text-xs text-muted-foreground truncate block">
            {device.brand} {device.model} · {device.ip_address}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{item.u_size}U</span>
    </div>
  );
}

export { U_SIZE_COLORS };
