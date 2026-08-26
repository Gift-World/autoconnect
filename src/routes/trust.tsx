import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Car, FileCheck2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const checks = [
  { icon: UserRoundCheck, title: "Seller verification", body: "Seller profiles progress through account, business, and document review. A verified label should only be shown after that review is complete." },
  { icon: Car, title: "Vehicle evidence", body: "Each listing should show its own photos, VIN or chassis evidence where available, condition information, and documents. Missing evidence is shown as pending—not assumed complete." },
  { icon: FileCheck2, title: "Inspection and title checks", body: "Inspection, title, and import-duty statuses are recorded per vehicle. Review the vehicle passport and ask questions before reserving a car." },
  { icon: ShieldCheck, title: "Protected payment workflow", body: "Card, bank-transfer, and M-Pesa requests follow recorded transaction milestones. Funds must not be released until payment, handover, and buyer confirmation requirements are met." },
];

export const Route = createFileRoute("/trust")({
  head: () => ({ meta: [{ title: "Trust Center — AutoConnect" }, { name: "description", content: "Understand the seller, vehicle, inspection, and payment evidence available on AutoConnect." }] }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-teal-50/50 py-12 sm:py-16">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Trust center</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">Evidence before a decision.</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">AutoConnect is designed to make the information behind a vehicle visible. Treat every status as evidence to review—not a substitute for your own inspection or professional advice.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {checks.map(({ icon: Icon, title, body }) => (
            <section key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/10 text-teal-700"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700"><Link to="/cars">Browse live listings</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/how-payments-work">Read payment and dispute process</Link></Button>
        </div>
        <p className="mt-8 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />Do not send money outside the recorded transaction workflow. Report any request for an off-platform payment through the support path.</p>
      </div>
    </main>
  );
}
