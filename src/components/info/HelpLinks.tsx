import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileText, Landmark, LifeBuoy, Scale, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HelpKey = "trust" | "payments" | "disputes" | "support" | "terms";

const LINKS: Record<HelpKey, { to: string; label: string; body: string; Icon: LucideIcon }> = {
  trust: {
    to: "/trust",
    label: "Trust center",
    body: "Seller, vehicle, inspection and payment evidence.",
    Icon: ShieldCheck,
  },
  payments: {
    to: "/how-payments-work",
    label: "Payment process",
    body: "How funds are held, reviewed and released.",
    Icon: Landmark,
  },
  disputes: {
    to: "/disputes",
    label: "Dispute process",
    body: "Raise concerns before confirming receipt.",
    Icon: Scale,
  },
  support: {
    to: "/support",
    label: "Get support",
    body: "Find the right channel for your question.",
    Icon: LifeBuoy,
  },
  terms: {
    to: "/terms",
    label: "Terms of use",
    body: "Marketplace rules for every side.",
    Icon: FileText,
  },
};

/** "Keep exploring" row of related help pages, omitting the current one. */
export function HelpLinks({
  current,
  include = ["trust", "payments", "disputes", "support"],
  title = "Keep exploring",
}: {
  current?: HelpKey;
  include?: HelpKey[];
  title?: string;
}) {
  const items = include.filter((key) => key !== current).map((key) => LINKS[key]);
  return (
    <section aria-labelledby="help-links-title" className="mx-auto max-w-[1360px] px-4 py-16 sm:px-6 sm:py-24">
      <h2 id="help-links-title" className="brand-kicker text-muted-foreground">
        {title}
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ to, label, body, Icon }) => (
          <Link
            key={to}
            to={to as never}
            className="group flex min-h-[88px] items-center gap-4 rounded-3xl border border-border bg-card p-5 transition hover:border-foreground/30 hover:shadow-md"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-foreground">{label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
