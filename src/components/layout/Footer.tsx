import { Link } from "@tanstack/react-router";
import { Car, Globe, ShieldCheck, Lock, Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-accent text-accent-foreground">
                <Globe className="h-4 w-4 opacity-70" />
                <Car className="absolute h-3.5 w-3.5 translate-y-[1px]" />
              </span>
              <span className="font-display text-lg">AutoConnect</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              The trusted global marketplace for buying, selling, and importing
              cars across borders.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Instagram, Linkedin, Facebook].map((I, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="social"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <FooterCol
            title="Marketplace"
            links={[
              { to: "/cars", label: "Browse Cars" },
              { to: "/import", label: "Import a Car" },
              { to: "/seller/dashboard", label: "Sell Your Car" },
              { to: "/import", label: "How It Works" },
            ]}
          />

          <FooterCol
            title="Support"
            links={[
              { to: "/import", label: "Contact Us" },
              { to: "/import", label: "FAQ" },
              { to: "/import", label: "Report a Listing" },
              { to: "/import", label: "Trust & Safety" },
            ]}
          />

          <FooterCol
            title="Legal"
            links={[
              { to: "/import", label: "Privacy Policy" },
              { to: "/import", label: "Terms of Service" },
              { to: "/import", label: "Cookie Policy" },
              { to: "/import", label: "Refund Policy" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} AutoConnect. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Lock className="h-3 w-3" /> Secured by Stripe
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <ShieldCheck className="h-3 w-3" /> Powered by Lovable Cloud
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
      <h4 className="text-sm font-bold uppercase tracking-wider text-primary-foreground/90">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l, i) => (
          <li key={`${l.to}-${i}`}>
            <Link
              to={l.to as never}
              className="text-sm text-primary-foreground/70 transition hover:text-primary-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
