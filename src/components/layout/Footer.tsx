import { Link } from "@tanstack/react-router";
import { Car, Globe, ShieldCheck, Lock, Twitter, Instagram, Linkedin, Facebook, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-900">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20">
                <Globe className="h-5 w-5 opacity-40" />
                <Car className="absolute h-4 w-4" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                AutoConnect
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              The trusted global marketplace for buying, selling, and importing verified vehicles across borders with full escrow protection.
            </p>
            <div className="flex gap-2.5 pt-2">
              {[Twitter, Instagram, Linkedin, Facebook].map((I, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="social link"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
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
              { to: "/trust", label: "Trust Center" },
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
              { to: "/trust", label: "Seller & Vehicle Verification" },
              { to: "/how-payments-work", label: "Payment & Handover" },
              { to: "/disputes", label: "Buyer Dispute Process" },
              { to: "/support", label: "Support & Contact" },
            ]}
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© {new Date().getFullYear()} AutoConnect Technologies Inc. All rights reserved.</p>
            <Link to="/privacy" className="hover:text-teal-700">Privacy</Link>
            <Link to="/terms" className="hover:text-teal-700">Terms</Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-700">
              <Lock className="h-3 w-3 text-teal-600" /> Protected payment workflow
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
              <ShieldCheck className="h-3 w-3 text-teal-600" /> Evidence shown per listing
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
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l, i) => (
          <li key={`${l.to}-${i}`}>
            <Link
              to={l.to as never}
              className="text-xs font-medium text-slate-600 transition hover:text-teal-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
