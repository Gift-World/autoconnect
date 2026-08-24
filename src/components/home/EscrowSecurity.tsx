import { Link } from "@tanstack/react-router";
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  KeyRound,
  Banknote,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function EscrowSecurity() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-teal-50/60 py-20 lg:py-28 text-slate-900">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-300/25 blur-[130px]" />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/85 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 shadow-sm backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-teal-600" /> Guaranteed Escrow Security
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your money stays protected.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Never send direct money to strangers. AutoConnect holds your deposit or full purchase amount in a secured trust account until you physically test-drive and verify the vehicle.
          </p>
        </div>

        {/* Visual Transaction Flow */}
        <div className="mt-16 rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-10 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 items-stretch relative">
            {/* Step 1: Buyer Deposit */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Step 01</span>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-300">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Buyer Deposits</h4>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  Payment is made via Card (Stripe), M-Pesa, or direct Bank Wire into a ring-fenced escrow account.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Escrow Locked
              </div>
            </div>

            {/* Step 2: AutoConnect Trust Custody */}
            <div className="flex flex-col justify-between rounded-2xl border border-teal-300 bg-teal-50 p-5 shadow-lg shadow-teal-500/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Step 02</span>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500 text-slate-950">
                    <Lock className="h-4 w-4" />
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Secure Custody</h4>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                  AutoConnect notifies the seller that funds are secured. Zero funds are accessible by the seller yet.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-200 text-[11px] font-medium text-teal-700 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
              </div>
            </div>

            {/* Step 3: Physical Inspection */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Step 03</span>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-300">
                    <SearchCheck className="h-4 w-4" />
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900">In-Person Check</h4>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  Buyer physically test-drives the vehicle, verifies logbook authenticity, and reviews mechanical condition.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-medium text-amber-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Buyer Inspects
              </div>
            </div>

            {/* Step 4: 6-Digit Handover PIN */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Step 04</span>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-300">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Handover PIN</h4>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  When satisfied, the buyer issues their private 6-digit release PIN to formally accept the car.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-medium text-teal-700 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" /> Buyer Authorized
              </div>
            </div>

            {/* Step 5: Instant Seller Payout */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Step 05</span>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900">Seller Payout</h4>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  Funds are automatically released to the seller's verified bank account or M-Pesa business till.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </div>
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-500/20 text-teal-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-bold text-slate-900">Buyer Escrow Protection:</span> If the vehicle fails physical inspection or title checks, your funds remain protected and are refunded.
              </p>
            </div>

            <Button
              asChild
              className="rounded-xl bg-teal-500 px-6 font-bold text-slate-950 hover:bg-teal-400 shrink-0"
            >
              <Link to="/how-payments-work">
                See How Payments Work <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
