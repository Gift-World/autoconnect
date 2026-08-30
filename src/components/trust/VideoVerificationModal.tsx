import React, { useState, useEffect } from "react";
import {
  Video,
  Play,
  Pause,
  CheckCircle2,
  CircleDot,
  Upload,
  Sparkles,
  Camera,
  ShieldCheck,
  RotateCcw,
  X,
  FileVideo,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const CHECKLIST_STAGES = [
  { id: "front", title: "Front Exterior", duration: "10 sec", desc: "Show bumper, headlights, grille, and hood alignment" },
  { id: "driver", title: "Driver Side", duration: "10 sec", desc: "Pan down doors, fenders, side mirror, and wheels" },
  { id: "rear", title: "Rear Exterior", duration: "10 sec", desc: "Show boot lid, taillights, exhaust, and bumper condition" },
  { id: "passenger", title: "Passenger Side", duration: "10 sec", desc: "Pan down passenger doors, quarter panel, and rims" },
  { id: "engine", title: "Engine Bay", duration: "10 sec", desc: "Open hood, show battery, fluid caps, and running engine sound" },
  { id: "interior", title: "Dashboard & Interior", duration: "10 sec", desc: "Show odometer, AC controls, infotainment screen, and seats" },
];

interface VideoVerificationModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  carTitle?: string;
  videoUrl?: string | null;
  isSellerMode?: boolean;
  onVideoUploaded?: (url: string) => void;
}

export function VideoVerificationModal({
  open,
  onOpenChange,
  carTitle = "Vehicle",
  videoUrl,
  isSellerMode = false,
  onVideoUploaded,
}: VideoVerificationModalProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [simulatedVideo, setSimulatedVideo] = useState<string | null>(videoUrl || null);

  // Auto increment recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 59) {
            setIsRecording(false);
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    toast.info("Recording Started", {
      description: "Follow the 6 guided checkpoints to complete the 60-second walk-around.",
    });
  };

  const handleFinishRecording = () => {
    setIsRecording(false);
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      const fakeUrl = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
      setSimulatedVideo(fakeUrl);
      onVideoUploaded?.(fakeUrl);
      toast.success("Walk-Around Video Uploaded!", {
        description: "+10 AutoConnect Score bonus awarded to this listing.",
        icon: <ShieldCheck className="h-4 w-4 text-teal-400" />,
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border-border p-0">
        <div className="bg-slate-950 p-5 border-b border-white/10 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Video className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  Seller Walk-Around Video Verification
                  <Badge variant="outline" className="text-[10px] bg-teal-500/15 text-teal-300 border-teal-500/30">
                    +10 PTS SCORE BONUS
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {carTitle} · 60-Second Guided Inspection Walk-Around
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Video Player / Recording Simulation Frame */}
          <div className="relative aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden border border-border shadow-inner grid place-items-center">
            {simulatedVideo ? (
              <div className="relative h-full w-full">
                <img
                  src={simulatedVideo}
                  alt="Video frame"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-teal-500 text-slate-950 shadow-xl cursor-pointer hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-black/70 backdrop-blur text-xs text-white">
                  <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> 6-Point Walk-Around Video Verified
                  </span>
                  <span className="font-mono text-slate-400">0:60 min</span>
                </div>
              </div>
            ) : isRecording ? (
              <div className="space-y-3 text-center text-white">
                <div className="h-4 w-4 rounded-full bg-rose-500 animate-ping mx-auto" />
                <p className="text-sm font-bold text-rose-400">
                  REC · {recordingSeconds}s / 60s
                </p>
                <p className="text-xs text-slate-300 max-w-sm">
                  Currently recording: <strong>{CHECKLIST_STAGES[Math.min(CHECKLIST_STAGES.length - 1, Math.floor(recordingSeconds / 10))].title}</strong>
                </p>
                <Button
                  onClick={handleFinishRecording}
                  className="h-10 px-5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400"
                >
                  Stop & Upload Video
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center p-6">
                <Camera className="h-12 w-12 text-teal-400 opacity-80 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Ready to Record Walk-Around</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Take a continuous 60-second video of this car. Buyers trust verified video listings 3.5x more!
                  </p>
                </div>
                <Button
                  onClick={handleStartRecording}
                  className="h-11 px-6 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2"
                >
                  <Camera className="h-4 w-4" /> Start 60s Walk-Around
                </Button>
              </div>
            )}
          </div>

          {/* 6-Stage Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              6-Step Walk-Around Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST_STAGES.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-3 rounded-xl border border-border/80 bg-card/60 flex items-start gap-2.5 text-xs"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{st.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{st.duration}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
