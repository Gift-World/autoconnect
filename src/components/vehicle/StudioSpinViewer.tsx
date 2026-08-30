import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Hotspot {
  angle: number; // Degree (0 - 360)
  title: string;
  description: string;
  tag: string;
}

interface StudioSpinViewerProps {
  images: string[];
  vehicleTitle: string;
  year?: number;
  className?: string;
}

export function StudioSpinViewer({
  images,
  vehicleTitle,
  year,
  className = "",
}: StudioSpinViewerProps) {
  const [currentAngle, setCurrentAngle] = useState(0); // 0 to 359
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const autoSpinTimerRef = useRef<any>(null);

  // Available photo angles array - strictly filter to valid vehicle photos
  const validImages = (images && images.length > 0 ? images : []).filter(
    (url) => url && typeof url === "string" && url.trim().length > 0
  );

  // Map degree to image index
  const frameIndex = validImages.length > 0
    ? Math.floor((currentAngle / 360) * validImages.length) % validImages.length
    : 0;
  const currentImage = validImages[frameIndex] || validImages[0] || "";

  const hotspots: Hotspot[] = [
    {
      angle: 15,
      title: "Bi-LED Matrix Headlights",
      tag: "Lighting",
      description: "Adaptive high-beam assist with integrated LED daytime running lights & radar cluster.",
    },
    {
      angle: 90,
      title: "Diamond-Cut Alloy Wheels",
      tag: "Wheels & Brakes",
      description: "19-inch multi-spoke sport alloys with ventilated disc brakes and Bridgestone tyres.",
    },
    {
      angle: 180,
      title: "Dual Exhaust & Power Tailgate",
      tag: "Rear Styling",
      description: "Hands-free sensor-activated power tailgate with acoustic dual exhaust ports.",
    },
    {
      angle: 270,
      title: "Driver Cockpit & Panoramic Glass",
      tag: "Interior",
      description: "Perforated leather comfort seats with electric adjustment and acoustic insulated windshield.",
    },
  ];

  // Auto-spin effect
  useEffect(() => {
    if (isAutoSpinning) {
      autoSpinTimerRef.current = setInterval(() => {
        setCurrentAngle((prev) => (prev + 1) % 360);
      }, 40);
    } else {
      if (autoSpinTimerRef.current) clearInterval(autoSpinTimerRef.current);
    }
    return () => {
      if (autoSpinTimerRef.current) clearInterval(autoSpinTimerRef.current);
    };
  }, [isAutoSpinning]);

  // Check for nearby hotspot
  useEffect(() => {
    const nearby = hotspots.find((h) => Math.abs(h.angle - currentAngle) < 25);
    setActiveHotspot(nearby || null);
  }, [currentAngle]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsAutoSpinning(false);
    startXRef.current = e.clientX;
    startAngleRef.current = currentAngle;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    // 300px drag = 360 degree rotation
    const sensitivity = 0.8;
    let nextAngle = Math.round(startAngleRef.current - deltaX * sensitivity) % 360;
    if (nextAngle < 0) nextAngle += 360;
    setCurrentAngle(nextAngle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl border border-white/10 select-none ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "aspect-[16/10] sm:aspect-[16/9] w-full"
      } ${className}`}
    >
      {/* Studio Lighting & Vignette Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
      
      {/* Studio Turntable Stage Grid */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-[35%] rounded-[100%] bg-white/5 border border-white/10 blur-[1px] transform rotate-x-[60deg] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-[20%] rounded-[100%] bg-teal-500/15 blur-2xl pointer-events-none" />

      {/* Main Interactive Stage */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative z-10 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing p-6"
      >
        <div
          style={{ transform: `scale(${zoomLevel})` }}
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
        >
          <img
            src={currentImage}
            alt={vehicleTitle}
            draggable={false}
            className="max-h-[60vh] sm:max-h-[70vh] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] pointer-events-none"
          />

          {/* Turntable Floor Shadow Reflection */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/70 blur-xl rounded-full pointer-events-none" />
        </div>

        {/* Drag Hint Overlay */}
        {!isDragging && !isAutoSpinning && currentAngle === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
            <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-semibold flex items-center gap-2 text-white/90 shadow-xl">
              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              <span>Drag to rotate 360°</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Studio HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wider text-teal-300">
            360° VIRTUAL STUDIO
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.3 : 1))}
            className="h-8 w-8 p-0 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-white/10"
            title="Toggle Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-white/10"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Active Hotspot Callout Card */}
      {activeHotspot && (
        <div className="absolute top-16 left-4 sm:left-6 z-20 max-w-xs bg-slate-950/80 backdrop-blur-xl border border-teal-500/40 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md">
              {activeHotspot.tag}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{activeHotspot.angle}° Angle</span>
          </div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-teal-400 shrink-0" />
            {activeHotspot.title}
          </h4>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">{activeHotspot.description}</p>
        </div>
      )}

      {/* Bottom Turntable Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/75 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-2xl">
        {/* Play/Pause Auto-spin & Reset */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAutoSpinning((v) => !v)}
            className={`h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 transition-all ${
              isAutoSpinning
                ? "bg-teal-500 text-slate-950 font-bold hover:bg-teal-400"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isAutoSpinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isAutoSpinning ? "Pause Spin" : "Auto-Spin"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentAngle(0)}
            className="h-8 px-2.5 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10"
            title="Reset to Front View (0°)"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            0° Front
          </Button>
        </div>

        {/* 360 Degree Scrubber Slider */}
        <div className="flex items-center gap-3 w-full sm:w-64">
          <span className="text-[10px] font-mono text-white/50 shrink-0">0°</span>
          <input
            type="range"
            min="0"
            max="359"
            value={currentAngle}
            onChange={(e) => {
              setIsAutoSpinning(false);
              setCurrentAngle(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
          />
          <span className="text-[11px] font-mono font-bold text-teal-300 w-10 text-right shrink-0">
            {currentAngle}°
          </span>
        </div>

        {/* Hotspot Quick Toggles */}
        <div className="hidden md:flex items-center gap-1">
          {hotspots.map((h) => (
            <button
              key={h.angle}
              onClick={() => {
                setIsAutoSpinning(false);
                setCurrentAngle(h.angle);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                Math.abs(h.angle - currentAngle) < 25
                  ? "border-teal-400 bg-teal-500/20 text-teal-300 font-bold"
                  : "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {h.tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
