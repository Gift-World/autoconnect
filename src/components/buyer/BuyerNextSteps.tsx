import { ShieldCheck, FileSearch, HandCoins, Handshake } from "lucide-react";

const STEPS = [
  {
    icon: FileSearch,
    title: "Check the Vehicle Passport",
    body: "See which checks AutoConnect has completed and what is still missing before you commit.",
  },
  {
    icon: ShieldCheck,
    title: "Reserve or pay through AutoConnect",
    body: "Card, M-Pesa or bank transfer. Manual payments are reviewed by an admin before they count as received.",
  },
  {
    icon: Handshake,
    title: "Inspect and take handover",
    body: "The seller marks the car ready. Inspect it in person and confirm you received it.",
  },
  {
    icon: HandCoins,
    title: "Funds released after verification",
    body: "Money is held until handover is confirmed. If something is wrong, raise a dispute before confirming.",
  },
];

/** Buyer-facing explanation of payment protection and what to do next. */
export function BuyerNextSteps() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/30 p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Payment protected — how buying works
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Documents reviewed by AutoConnect. Funds released after verification of handover.
        </p>
      </div>
      <ol className="grid gap-3 p-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t bg-muted/20 p-3 text-[11px] text-muted-foreground">
        AutoConnect reviews sellers, documents and payments. We do not guarantee the condition of
        any vehicle — always inspect before confirming handover.
      </p>
    </section>
  );
}
