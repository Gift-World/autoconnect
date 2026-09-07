import React from "react";
import { Box, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          "environment-image"?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ArPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carTitle?: string;
}

export function ArPreviewModal({ open, onOpenChange, carTitle = "Vehicle" }: ArPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border-border p-0 bg-slate-950">
        <div className="p-5 border-b border-white/10 text-white z-10 relative">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Box className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                AR 3D Spatial Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Interact with the 3D model below. Tap "View in your space" on a mobile device for full AR.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[60vh] sm:h-[70vh] bg-slate-900">
          {/* @ts-ignore */}
          <model-viewer
            src="/models/car.glb"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            environment-image="neutral"
            style={{ width: "100%", height: "100%", backgroundColor: "#020617" }}
          >
            <Button
              slot="ar-button"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 text-white hover:bg-purple-500 shadow-2xl px-6 py-5 text-sm font-bold border border-white/10"
            >
              <Smartphone className="h-4 w-4 mr-2" /> View in your space
            </Button>
          </model-viewer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
