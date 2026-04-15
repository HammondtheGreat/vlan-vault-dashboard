import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PdfViewerDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export default function PdfViewerDialog({ open, onClose, url, title }: PdfViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-foreground text-sm truncate">
            {title || "PDF Document"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-4 pb-4">
          <iframe
            src={url}
            className="w-full h-full rounded-md border border-border bg-background"
            title="PDF Viewer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
