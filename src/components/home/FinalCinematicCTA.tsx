import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Plane, Car, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCinematicCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 text-white">
      {/* Background cinematic imagery with deep midnight gradient */}
      <div className="absolute inset-0 select-none pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2400&auto=format&fit=crop&q=85"
          alt="Cinematic luxury car rear at sunset"
          className="h-full w-full object-cover object-center opacity-40 brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/85" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            The Future of Automotive Commerce
          </div>

          <h2 className="font-display mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
            Your next drive{" "}
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              starts here.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-xl font-normal text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Buy locally with complete inspection clarity. Import globally without middleman risk. Pay securely through bank-grade escrow.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-2xl bg-teal-500 px-8 text-base font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition-all duration-200 hover:bg-teal-400 hover:scale-105"
            >
              <Link to="/cars">
                <Car className="mr-2 h-5 w-5" />
                Browse Verified Cars
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl border-white/20 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:border-white/40"
            >
              <Link to="/import">
                <Plane className="mr-2 h-5 w-5 text-teal-300" />
                Import a Car
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-14 rounded-2xl px-6 text-base font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Link to="/seller">
                Sell Your Car <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Guarantee pill */}
          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs text-slate-400 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>Escrow payment protection & 150-point inspection guaranteed on all listings.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
