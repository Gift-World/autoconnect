import { Link } from "@tanstack/react-router";
import { ArrowRight, Plane, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CinematicImport() {
  return (
    <>
      <section className="bg-slate-900 text-slate-50 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side */}
            <div>
              <h2 className="text-4xl font-light tracking-tight sm:text-6xl text-white mb-6">
                Import without the uncertainty.
              </h2>
              <p className="text-lg text-slate-400 mb-10 max-w-lg">
                Source directly from Japan and understand the complete landed cost before committing.
              </p>
              <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-slate-200 px-8 py-6 text-sm font-semibold transition-all">
                <Link to="/import">
                  Explore Japan <ArrowRight className="mx-2 h-4 w-4" /> Kenya
                </Link>
              </Button>
            </div>

            {/* Right side */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-8 relative">
                <img
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop"
                  alt="Vehicles being loaded onto a RoRo ship in Japan"
                  className="h-full w-full object-cover opacity-80"
                />
                
                {/* Overlay route graphic */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
                  <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase text-white">
                    <span>Japan</span>
                    <div className="flex-1 border-b border-dashed border-slate-400 mx-4 relative">
                      <Ship className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-slate-300 bg-slate-900 rounded-full" />
                    </div>
                    <span>Mombasa</span>
                    <div className="flex-1 border-b border-dashed border-slate-400 mx-4" />
                    <span>Your Door</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xl font-medium text-white">21–28 days</p>
                  <p className="mt-1 text-xs text-slate-400">Typical RoRo transit</p>
                </div>
                <div>
                  <p className="text-xl font-medium text-white">KRA + CRSP</p>
                  <p className="mt-1 text-xs text-slate-400">Duty calculation</p>
                </div>
                <div>
                  <p className="text-xl font-medium text-white">Full landed cost</p>
                  <p className="mt-1 text-xs text-slate-400">Before commitment</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="bg-slate-50 dark:bg-slate-950 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Calculator Left side */}
            <div className="order-2 lg:order-1">
              <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
                Know your number before you buy
              </h2>
              <h3 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl mb-10">
                Estimate your complete import cost.
              </h3>
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-md">
                <div className="space-y-4">
                  <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Vehicle price</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">$18,500</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">$1,200</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Import duty</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-slate-400 italic">Calculated</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">VAT</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-slate-400 italic">Calculated</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Port & clearance</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-slate-400 italic">Calculated</span>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <span className="text-lg font-medium text-slate-900 dark:text-slate-100">Estimated landed cost</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">KSh 4,180,000</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Button asChild className="w-full rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-6 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200">
                    <Link to="/import/calculator">
                      Calculate my cost <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Calculator Right side */}
            <div className="order-1 lg:order-2">
              <div className="aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden relative shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop"
                  alt="Beautiful imported SUV"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
