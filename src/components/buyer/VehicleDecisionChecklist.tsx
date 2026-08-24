import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileSearch, ShieldCheck } from "lucide-react";

export function VehicleDecisionChecklist({
  carId,
  documentsVerified,
  titleVerified,
  inspectionVerified,
}: {
  carId: string;
  documentsVerified: boolean;
  titleVerified: boolean;
  inspectionVerified: boolean;
}) {
  const items = [
    { label: "Review the vehicle passport and photo set", done: documentsVerified },
    { label: "Confirm title / registration evidence", done: titleVerified },
    { label: "Review the inspection status and arrange viewing", done: inspectionVerified },
    { label: "Keep payment and handover inside the recorded workflow", done: false },
  ];

  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><FileSearch className="h-4 w-4" /></span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Buyer checklist for this vehicle</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Use this before you reserve, pay, or confirm handover. A completed status reflects recorded evidence, not a substitute for an in-person inspection.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-sm text-slate-700">
            {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800">
        <ShieldCheck className="h-3.5 w-3.5" /> Read what each check means
      </Link>
      <span className="sr-only">Vehicle ID: {carId}</span>
    </section>
  );
}
