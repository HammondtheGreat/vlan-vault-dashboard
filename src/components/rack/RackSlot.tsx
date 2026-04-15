import { useDroppable } from "@dnd-kit/core";

interface RackSlotProps {
  uPosition: number;
  isOver?: boolean;
  children?: React.ReactNode;
}

export function EmptyRackSlot({ uPosition }: { uPosition: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${uPosition}`, data: { uPosition } });

  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed rounded-md flex items-center px-3 text-muted-foreground/40 transition-colors ${
        isOver ? "border-primary/60 bg-primary/10" : "border-border/40"
      }`}
      style={{ height: "40px" }}
    >
      <span className="text-xs font-mono w-12">U{uPosition}</span>
      <span className="text-xs italic">{isOver ? "Drop here" : "Empty"}</span>
    </div>
  );
}
