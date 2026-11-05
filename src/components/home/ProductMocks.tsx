import type { ReactNode } from "react";
import { ArrowUp, Check, CircleDashed, Gauge, Lock, ShieldCheck, Sparkles, Wrench } from "lucide-react";

/**
 * Illustrative phone screens for the home page story — they show what each
 * AutoConnect feature looks like, the way a product tour would. Every screen is
 * labelled "Example" and uses no real listing, person or verification.
 */
function Phone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[290px]" aria-label={`Example screen: ${label}`} role="img">
      <div className="rounded-[2.6rem] border-[7px] border-ac-ink bg-ac-ink shadow-[0_30px_60px_rgba(0,0,0,.25)]">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-[#f7f6f2] text-ac-ink">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-ac-ink" />
          <div className="px-4 pb-5 pt-3">{children}</div>
        </div>
      </div>
      <span className="absolute -right-2 top-6 rounded-full bg-ac-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        Example
      </span>
    </div>
  );
}

const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-ac-ink/50">{children}</p>
);

export function SearchMock() {
  return (
    <Phone label="AI car search">
      <Kicker>AI car search</Kicker>
      <p className="font-brand mt-1 text-xl">Find your fit</p>
      <div className="mt-3 rounded-2xl rounded-br-md bg-ac-ink px-3 py-2 text-[11px] font-semibold text-white">
        7-seater for family trips, under 5M, low mileage
      </div>
      <div className="mt-2 flex items-start gap-1.5 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[11px] leading-4">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
        Here are SUVs with 7 seats under KES 5M. Want diesel only?
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["SUV · 7 seats · Diesel", "KES 4.6M", "52,000 km"],
          ["SUV · 7 seats · Hybrid", "KES 4.9M", "38,000 km"],
        ].map(([title, price, km]) => (
          <div key={title} className="flex items-center gap-2 rounded-xl bg-white p-2">
            <span className="h-10 w-14 shrink-0 rounded-lg bg-[linear-gradient(135deg,#d9d7cf,#b9b7ae)]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold">{title}</span>
              <span className="block text-[10px] text-ac-ink/60">{km}</span>
            </span>
            <span className="text-[11px] font-extrabold">{price}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1 text-[11px] text-ac-ink/50">
        Ask anything…
        <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-ac-accent text-ac-ink">
          <ArrowUp className="h-3 w-3" />
        </span>
      </div>
    </Phone>
  );
}

export function EvidenceMock() {
  const rows: [string, "done" | "pending"][] = [
    ["Seller identity", "done"],
    ["Logbook uploaded", "done"],
    ["Mileage records", "done"],
    ["Inspection report", "pending"],
  ];
  return (
    <Phone label="Vehicle evidence">
      <Kicker>Vehicle passport</Kicker>
      <p className="font-brand mt-1 text-xl">What's known</p>
      <div className="mt-3 rounded-2xl bg-white p-3">
        <div className="flex items-center justify-between text-[11px] font-bold">
          Evidence shown <span>3 of 4</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-ac-ink/10">
          <div className="h-full w-3/4 rounded-full bg-ac-ink" />
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map(([label, state]) => (
          <li key={label} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold">
            {state === "done" ? (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ac-accent">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <CircleDashed className="h-5 w-5 text-ac-ink/40" />
            )}
            {label}
            <span className="ml-auto text-[10px] text-ac-ink/50">{state === "done" ? "Attached" : "Not yet"}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-2xl bg-ac-ink p-3 text-[11px] leading-4 text-white">
        <span className="flex items-center gap-1 font-bold text-ac-accent">
          <Sparkles className="h-3 w-3" /> AI explains
        </span>
        No inspection yet. Ask the seller for one before you pay.
      </div>
    </Phone>
  );
}

export function PaymentMock() {
  const steps = ["Reserved", "Payment held", "Handover", "Released to seller"];
  return (
    <Phone label="Payment milestones">
      <Kicker>Your purchase</Kicker>
      <p className="font-brand mt-1 text-xl">Money, step by step</p>
      <div className="mt-3 rounded-2xl bg-ac-ink p-3 text-white">
        <p className="text-[10px] text-white/60">Held until handover</p>
        <p className="font-brand text-2xl">KES 4,620,000</p>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-white/70">
          <Lock className="h-3 w-3 text-ac-accent" /> Not released to the seller yet
        </p>
      </div>
      <ol className="mt-3 space-y-0">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="flex flex-col items-center">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${
                  i < 2 ? "bg-ac-accent" : i === 2 ? "border-2 border-ac-ink bg-white" : "border border-ac-ink/20 bg-white"
                }`}
              >
                {i < 2 ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className={`h-5 w-px ${i < 2 ? "bg-ac-ink" : "bg-ac-ink/20"}`} />}
            </span>
            <span className={`pt-0.5 text-[11px] ${i === 2 ? "font-extrabold" : i < 2 ? "font-semibold" : "text-ac-ink/50"}`}>
              {step}
              {i === 2 && <span className="block text-[10px] font-medium text-ac-ink/60">Confirm when you have the car</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-full bg-ac-accent py-2 text-center text-[11px] font-extrabold">I've received the car</div>
    </Phone>
  );
}

export function GarageMock() {
  return (
    <Phone label="My Garage">
      <Kicker>My Garage</Kicker>
      <p className="font-brand mt-1 text-xl">Family SUV</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3">
          <Gauge className="h-4 w-4" />
          <p className="font-brand mt-1 text-lg">68,400</p>
          <p className="text-[10px] text-ac-ink/60">km on the clock</p>
        </div>
        <div className="rounded-2xl bg-ac-accent p-3">
          <Wrench className="h-4 w-4" />
          <p className="font-brand mt-1 text-lg">600 km</p>
          <p className="text-[10px] text-ac-ink/70">to next service</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white p-3 text-[11px] font-semibold">
        <ShieldCheck className="h-4 w-4" /> Insurance renews in 21 days
      </div>
      <div className="mt-2 rounded-2xl bg-ac-ink p-3 text-[11px] leading-4 text-white">
        <span className="flex items-center gap-1 font-bold text-ac-accent">
          <Sparkles className="h-3 w-3" /> This week
        </span>
        Service is due before your long trip. Book a slot and keep the receipt with the car.
      </div>
      <div className="mt-3 rounded-full bg-ac-ink py-2 text-center text-[11px] font-extrabold text-white">Book a service</div>
    </Phone>
  );
}
