import { Check } from "lucide-react";

export function TrustPipeline() {
  return (
    <section className="bg-white dark:bg-slate-950 py-24 sm:py-32 border-t border-slate-100 dark:border-slate-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Buy with evidence.
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Know what you're buying before you pay.
          </p>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-8 sm:p-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-500/10 px-3 py-1 mb-6">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                Verified
              </span>
            </div>

            <h3 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-8">
              Toyota Harrier 2021
            </h3>

            <div className="space-y-4">
              {[
                "Inspection",
                "Seller identity",
                "Mileage",
                "Vehicle history",
                "Documents"
              ].map((item) => (
                <div key={item} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-slate-600 dark:text-slate-400">{item}</span>
                  <Check className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                42-point inspection completed
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-center text-sm font-medium text-slate-500">
          <span>Seller verified</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>Vehicle inspected</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>Documents reviewed</span>
        </div>
      </div>
    </section>
  );
}
