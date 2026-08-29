import React, { useState, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Calendar, ShieldCheck, Video, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

export interface ConciergeCarContext {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location?: string | null;
  seller_phone?: string | null;
  seller_whatsapp?: string | null;
}

interface WhatsAppConciergeProps {
  car?: ConciergeCarContext | null;
  className?: string;
  compact?: boolean;
}

const DEFAULT_CONCIERGE_NUMBER = "+254700000000"; // Platform VIP concierge line

export function WhatsAppConcierge({ car, className = "", compact = false }: WhatsAppConciergeProps) {
  const [mounted, setMounted] = useState(false);
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string>("availability");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted && !compact) return null;

  const phoneNumber = (car?.seller_whatsapp || car?.seller_phone || DEFAULT_CONCIERGE_NUMBER).replace(/[^0-9+]/g, "");

  const refId = car ? `AC-${car.id.slice(0, 8).toUpperCase()}` : undefined;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const templates: Record<string, { label: string; icon: any; text: string }> = {
    availability: {
      label: "Check Availability",
      icon: ShieldCheck,
      text: car
        ? `Hello AutoConnect! 🚗\nI'm inquiring about the *${car.year} ${car.make} ${car.model}* listed at *${formatPrice(car.price)}* (Ref #${refId}).\n\nIs this vehicle still available for inspection or escrow purchase?\n\nListing link: ${currentUrl}`
        : `Hello AutoConnect Concierge! 🚗\nI am looking for assistance with purchasing/importing a vehicle through your verified escrow system.\n\nCould you please assist me?`,
    },
    viewing: {
      label: "Book Physical Viewing",
      icon: Calendar,
      text: car
        ? `Hello! 🗓️\nI would like to schedule a physical viewing for the *${car.year} ${car.make} ${car.model}* (Ref #${refId}) located in ${car.location || "Nairobi"}.\n\nWhen is the earliest viewing slot available?\n\nLink: ${currentUrl}`
        : `Hello! I would like to schedule a physical viewing appointment for a vehicle listed on AutoConnect.`,
    },
    video: {
      label: "Live Video Walkaround",
      icon: Video,
      text: car
        ? `Hello! 📹\nI am interested in the *${car.year} ${car.make} ${car.model}* (Ref #${refId}). Could you arrange a live high-res video walkaround / cold engine start video for me?\n\nLink: ${currentUrl}`
        : `Hello! Could you arrange a live video inspection for a vehicle?`,
    },
    escrow: {
      label: "Escrow & Payment Inquiry",
      icon: Sparkles,
      text: car
        ? `Hi AutoConnect Support! 🛡️\nI want to proceed with reserving the *${car.year} ${car.make} ${car.model}* (${formatPrice(car.price)}, Ref #${refId}) via regulated escrow.\n\nCould you guide me through the next payment & verification steps?\n\nLink: ${currentUrl}`
        : `Hi AutoConnect Support! I have questions regarding escrow deposits and M-Pesa/bank wire milestone protection.`,
    },
  };

  const activeMessage = templates[selectedIntent]?.text || templates.availability.text;
  const fullMessage = customNote ? `${activeMessage}\n\n*Note:* ${customNote}` : activeMessage;

  const handleLaunchWhatsApp = () => {
    const encoded = encodeURIComponent(fullMessage);
    const cleanDigits = phoneNumber.replace(/\+/g, "");
    const waUrl = `https://wa.me/${cleanDigits}?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast.success("Inquiry message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <Button
        onClick={handleLaunchWhatsApp}
        className={`bg-[#25D366] hover:bg-[#20BD5A] text-slate-950 font-bold shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02] ${className}`}
      >
        <MessageCircle className="h-4 w-4 mr-1.5 fill-current" />
        WhatsApp Inquire
      </Button>
    );
  }

  return (
    <>
      {/* Floating Action Pill */}
      <div className={`fixed bottom-6 right-6 z-40 flex items-center ${className}`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-slate-950 px-4 py-3 rounded-full shadow-2xl shadow-[#25D366]/30 border-2 border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[#25D366]/50"
            aria-label="Open WhatsApp Concierge"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-950"></span>
            </span>
            <MessageCircle className="h-5 w-5 fill-current transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold tracking-tight">
              {car ? "WhatsApp Seller" : "VIP Concierge"}
            </span>
          </button>
        )}
      </div>

      {/* Concierge Modal / Slide Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#25D366]/90 to-[#128C7E] p-4 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-950/10 flex items-center justify-center border border-white/20">
                  <MessageCircle className="h-5 w-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    WhatsApp AutoConnect Direct
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-300"></span>
                  </h3>
                  <p className="text-[11px] opacity-85">Instant verified seller & concierge dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-950/10 hover:bg-slate-950/20 flex items-center justify-center text-slate-950 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Vehicle Context Pill (if on car page) */}
            {car && (
              <div className="bg-muted/50 border-b border-border p-3.5 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <span className="font-semibold text-foreground">
                    {car.year} {car.make} {car.model}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    Ref: <span className="font-mono text-accent">{refId}</span> • {formatPrice(car.price)}
                  </span>
                </div>
                <span className="shrink-0 bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium text-[10px]">
                  Verified Listing
                </span>
              </div>
            )}

            {/* Template Selector */}
            <div className="p-4 space-y-3.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Inquiry Topic:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(templates).map(([key, item]) => {
                  const Icon = item.icon;
                  const isSelected = selectedIntent === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedIntent(key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? "border-[#25D366] bg-[#25D366]/10 text-foreground font-semibold shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-[#25D366]" : "text-muted-foreground"}`} />
                      <span className="truncate text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Pre-filled Message:</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-foreground text-[10px] text-accent transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy message"}
                  </button>
                </div>
                <div className="bg-muted/60 border border-border/80 rounded-2xl p-3 text-xs text-foreground/90 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                  {fullMessage}
                </div>
              </div>

              {/* Optional Custom Note Input */}
              <div>
                <input
                  type="text"
                  placeholder="Add optional note or preferred viewing time..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 placeholder:text-muted-foreground"
                />
              </div>

              {/* CTA Buttons */}
              <div className="pt-2 flex gap-2">
                <Button
                  onClick={handleLaunchWhatsApp}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-slate-950 font-bold h-11 rounded-xl shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.01]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Open WhatsApp Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="h-11 rounded-xl px-4 border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
