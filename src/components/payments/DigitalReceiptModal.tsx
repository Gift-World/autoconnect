import React from "react";
import {
  ShieldCheck,
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  Lock,
  Car,
  MapPin,
  Calendar,
  Sparkles,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

export interface TransactionReceiptData {
  transactionId: string;
  carTitle: string;
  carVin?: string | null;
  make?: string;
  model?: string;
  year?: number;
  buyerName: string;
  buyerPhone?: string | null;
  sellerName: string;
  sellerLocation?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentPlan: string;
  timestamp: string;
  escrowStatus: string;
}

interface DigitalReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: TransactionReceiptData;
}

export function DigitalReceiptModal({
  open,
  onOpenChange,
  receipt,
}: DigitalReceiptModalProps) {
  const { formatPrice } = useCurrency();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `AutoConnect Verified Escrow Receipt: ${receipt.transactionId} for ${receipt.carTitle} (${formatPrice(receipt.amount, receipt.currency)})`
        );
        toast.success("Receipt details copied to clipboard!");
      }
    } catch {
      toast.error("Failed to copy receipt link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border-border p-0 print:border-none print:shadow-none">
        {/* Header Action Bar */}
        <div className="bg-slate-950 p-5 border-b border-white/10 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-white">
                Official Digital Escrow Receipt
              </DialogTitle>
              <p className="text-[11px] text-slate-400 font-mono">
                Ref: {receipt.transactionId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl text-xs gap-1"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 rounded-xl text-xs gap-1 text-slate-300 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>
        </div>

        {/* Official Printable Receipt Slip */}
        <div className="p-6 space-y-5 bg-card text-foreground">
          {/* Top Brand Banner */}
          <div className="text-center space-y-1 pb-4 border-b border-border">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-500 border border-teal-500/20 text-xs font-bold font-mono">
              <Lock className="h-3 w-3" /> AUTOCONNECT ESCROW SECURED
            </div>
            <h3 className="text-xl font-extrabold text-foreground tracking-tight pt-1">
              Proof of Escrow Reservation
            </h3>
            <p className="text-xs text-muted-foreground">
              Official Legal Payment Authorization · Nairobi Hub & Global Port Logistics
            </p>
          </div>

          {/* Amount Paid Highlight */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Total Amount Secured in Escrow
            </p>
            <p className="text-3xl font-black text-teal-500 font-mono">
              {formatPrice(receipt.amount, receipt.currency)}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Method: {receipt.paymentMethod.toUpperCase()} · Status: {receipt.escrowStatus}
            </p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs border-y border-border/80 py-4 font-mono">
            <div>
              <span className="text-muted-foreground block text-[10px]">TRANSACTION REF</span>
              <span className="font-bold text-foreground">{receipt.transactionId}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">DATE & TIME</span>
              <span className="font-semibold text-foreground">{receipt.timestamp}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">BUYER IDENTITY</span>
              <span className="font-semibold text-foreground">{receipt.buyerName}</span>
              {receipt.buyerPhone && <span className="text-[10px] text-muted-foreground block">{receipt.buyerPhone}</span>}
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">SELLER ENTITY</span>
              <span className="font-semibold text-foreground">{receipt.sellerName}</span>
              {receipt.sellerLocation && <span className="text-[10px] text-muted-foreground block">{receipt.sellerLocation}</span>}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vehicle Description
            </span>
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
              <p className="font-bold text-foreground text-sm">{receipt.carTitle}</p>
              {receipt.carVin && (
                <p className="text-muted-foreground font-mono text-[11px]">
                  Chassis / VIN: {receipt.carVin}
                </p>
              )}
              <p className="text-muted-foreground text-[11px]">
                Plan: {receipt.paymentPlan}
              </p>
            </div>
          </div>

          {/* QR Verification Barcode Simulation */}
          <div className="p-4 rounded-2xl bg-slate-950 text-white flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Instant NTSA / Escrow QR Verification
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Scan this code at Nairobi Yard to verify logbook title release or pickup authorization.
              </p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-white p-1 shrink-0 text-slate-950 shadow-inner">
              <QrCode className="h-14 w-14" />
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-muted-foreground pt-1">
            AutoConnect Escrow Trust System · Registered under Kenya Financial Regulations
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
