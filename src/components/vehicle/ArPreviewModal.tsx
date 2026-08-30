import React, { useState } from "react";
import {
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  Bell,
  Box,
  Layers,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ArPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carTitle?: string;
}

export function ArPreviewModal({
  open,
  onOpenChange,
  carTitle = "Vehicle",
}: ArPreviewModalProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [notified, setNotified] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }
    setNotified(true);
    toast.success("You're on the AR VIP list!", {
      description: `We'll notify you as soon as AR projection goes live for ${carTitle}.`,
      icon: <Sparkles className="h-4 w-4 text-teal-400" />,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-border p-0">
        <div className="bg-slate-950 p-5 border-b border-white/10 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Box className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                AR 3D Spatial Preview
                <Badge variant="outline" className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30">
                  COMING SOON
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Augmented Reality driveway preview
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Photorealistic AR in Environment Mockup */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-inner group">
            <img
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
              alt="AR car preview"
              className="h-full w-full object-cover"
            />
            {/* AR grid overlay simulation */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-purple-950/20 to-transparent flex items-end p-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/15 text-xs text-white">
                <Camera className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                <span>True-to-Scale 1:1 AR Hologram</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-1.5 pt-1">
            <h4 className="text-base font-extrabold text-foreground">
              See this car in your driveway with AR
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Project a life-sized 3D spatial hologram of {carTitle} directly into your parking space using your smartphone camera and LiDAR.
            </p>
          </div>

          {!notified ? (
            <form onSubmit={handleNotify} className="space-y-2 pt-2">
              <Input
                type="text"
                placeholder="Enter email or WhatsApp phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-md gap-2"
              >
                <Bell className="h-4 w-4" /> Notify Me When Available
              </Button>
            </form>
          ) : (
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center space-y-1">
              <p className="text-xs font-bold text-teal-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> You're on the early access list!
              </p>
              <p className="text-[11px] text-muted-foreground">
                We'll reach out to {emailOrPhone} as soon as WebXR AR is unlocked.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
