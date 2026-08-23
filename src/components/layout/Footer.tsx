import { Link } from "@tanstack/react-router";
import { Car, Globe, ShieldCheck, Lock, Twitter, Instagram, Linkedin, Facebook, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070b14] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20">
                <Globe className="h-5 w-5 opacity-40" />
                <Car className="absolute h-4 w-4" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                AutoConnect
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              The trusted global marketplace for buying, selling, and importing verified vehicles across borders with full escrow protection.
            </p>
            <div className="flex gap-2.5 pt-2">
              {[Twitter, Instagram, Linkedin, Facebook].map((I, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="social link"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 text-slate-400 transition hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-300"
                >
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace Links */}
          <FooterCol
            title="Marketplace"
            links={[
              { to: "/cars", label: "Browse All Cars" },
              { to: "/yards", label: "Accredited Dealerships" },
              { to: "/import", label: "Global Import Corridors" },
              { to: "/how-payments-work", label: "How Escrow Works" },
            ]}
          />

          {/* Sourcing Hubs */}
          <FooterCol
            title="Import Hubs"
            links={[
              { to: "/import", label: "Japan ➔ Kenya Corridor" },
              { to: "/import", label: "UK Luxury Sourcing" },
              { to: "/import", label: "UAE / Dubai Direct" },
              { to: "/import", label: "Duty & Tax Calculator" },
            ]}
          />

          {/* Trust & Safety */}
          <FooterCol
            title="Trust & Security"
            links={[
              { to: "/how-payments-work", label: "100% Escrow Guarantee" },
              { to: "/how-payments-work", label: "150-Point Inspection" },
              { to: "/how-payments-work", label: "NTSA Title Verification" },
              { to: "/how-payments-work", label: "Buyer Dispute Resolution" },
            ]}
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} AutoConnect Technologies Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1.5 text-teal-300">
              <Lock className="h-3 w-3 text-teal-400" /> Bank-Grade Escrow Custody
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
              <ShieldCheck className="h-3 w-3 text-teal-400" /> NTSA & JEVIC Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l, i) => (
          <li key={`${l.to}-${i}`}>
            <Link
              to={l.to as never}
              className="text-xs font-medium text-slate-400 transition hover:text-teal-300"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
