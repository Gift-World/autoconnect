import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Lock, ShieldCheck, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
        <div className="mx-auto max-w-[1360px] px-6 pb-10 pt-14 sm:px-10 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="grid h-11 w-11 overflow-hidden rounded-xl bg-white">
                  <img src="/logo-mark.jpg" alt="" className="h-full w-full object-cover" />
                </span>
                <span className="font-brand text-2xl">
                  Auto<span className="text-ac-accent">Connect</span>
                </span>
              </Link>
              <p className="font-brand mt-8 max-w-sm text-3xl sm:text-4xl">Find it. Prove it. Drive it. Keep its story.</p>
              <div className="mt-8 flex gap-2.5">
                {[
                  { Icon: Twitter, label: "AutoConnect on X" },
                  { Icon: Instagram, label: "AutoConnect on Instagram" },
                  { Icon: Linkedin, label: "AutoConnect on LinkedIn" },
                  { Icon: Facebook, label: "AutoConnect on Facebook" },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-ac-accent hover:text-ac-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <FooterCol
                title="Marketplace"
                links={[
                  { to: "/cars", label: "Browse all cars" },
                  { to: "/auctions", label: "Auctions" },
                  { to: "/yards", label: "Dealerships" },
                  { to: "/compare", label: "Compare cars" },
                  { to: "/pricing", label: "Seller plans & pricing" },
                ]}
              />
              <FooterCol
                title="Import"
                links={[
                  { to: "/import", label: "Japan → Kenya" },
                  { to: "/import", label: "UK sourcing" },
                  { to: "/import", label: "UAE / Dubai direct" },
                  { to: "/import#calculator", label: "Duty & tax calculator" },
                  { to: "/import-tracker", label: "Track an import" },
                ]}
              />
              <FooterCol
                title="Own & connect"
                links={[
                  { to: "/garage", label: "My Garage" },
                  { to: "/services", label: "Car care" },
                  { to: "/parts", label: "Parts" },
                  { to: "/community", label: "Community" },
                ]}
              />
              <FooterCol
                title="Trust"
                links={[
                  { to: "/trust", label: "Verification" },
                  { to: "/how-payments-work", label: "Payment & handover" },
                  { to: "/disputes", label: "Buyer disputes" },
                  { to: "/support", label: "Support & contact" },
                ]}
              />
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/55 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p>© {new Date().getFullYear()} AutoConnect Technologies Inc. All rights reserved.</p>
              <Link to="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white">
                Terms
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5">
                <Lock className="h-3 w-3 text-ac-accent" /> Payment milestones shown per transaction
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5">
                <ShieldCheck className="h-3 w-3 text-ac-accent" /> Evidence shown per listing
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="brand-kicker text-white/45">{title}</h4>
      <ul className="mt-4 space-y-1">
        {links.map((l, i) => (
          <li key={`${l.to}-${i}`}>
            <Link
              to={l.to as never}
              className="group inline-flex min-h-9 items-center gap-1 text-sm font-medium text-white/80 transition hover:text-ac-accent"
            >
              {l.label}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
