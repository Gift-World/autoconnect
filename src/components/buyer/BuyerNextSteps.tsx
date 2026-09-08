import { CalendarCheck, FileSearch, MessageCircle } from "lucide-react";

const STEPS = [
  {
    icon: FileSearch,
    title: "Read the evidence",
    body: "See what is recorded on this listing and what still needs to be confirmed.",
  },
  {
    icon: CalendarCheck,
    title: "Arrange a viewing",
    body: "Ask the seller for a time, location, inspection option and any documents you need to see.",
  },
  {
    icon: MessageCircle,
    title: "Agree the next step",
    body: "Confirm price, delivery and the available payment method before you send any money.",
  },
];

/** Buyer-facing explanation of payment protection and what to do next. */
export function BuyerNextSteps() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/30 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FileSearch className="h-5 w-5 text-primary" /> A clear path to this car
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A short, practical checklist for this listing. It does not replace an in-person inspection.
        </p>
      </div>
      <ol className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
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
      <p className="border-t bg-muted/20 p-3 text-[11px] text-muted-foreground sm:px-5">
        Never send money based only on a listing. Verify the vehicle, seller and payment instructions before proceeding.
      </p>
    </section>
  );
}
