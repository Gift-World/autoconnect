import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleHelp, FileCheck2, LifeBuoy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Section = { title: string; body: string };

export function PublicPolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-teal-50/40 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{intro}</p>
          <p className="mt-5 text-xs text-muted-foreground">Last updated: 24 August 2026. Obtain local legal review before public launch.</p>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Action icon={ShieldCheck} label="Trust center" to="/trust" />
          <Action icon={FileCheck2} label="Payment process" to="/how-payments-work" />
          <Action icon={LifeBuoy} label="Get support" to="/support" />
        </div>
      </div>
    </main>
  );
}

function Action({ icon: Icon, label, to }: { icon: typeof CircleHelp; label: string; to: string }) {
  return (
    <Button asChild variant="outline" className="h-11 justify-between rounded-xl border-border bg-card font-semibold hover:border-teal-300 hover:bg-teal-500/10">
      <Link to={to as never}>{label}<Icon className="h-4 w-4 text-teal-600" /><ArrowRight className="hidden" /></Link>
    </Button>
  );
}
