import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCinematicCTA() {
  return (
    <section className="bg-slate-900 text-slate-50 py-32 sm:py-40 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-8">
          Ready for your next car?
        </h2>
        
        <div className="mx-auto max-w-3xl">
          <p className="text-5xl sm:text-7xl font-light tracking-tight text-white mb-2">Find it.</p>
          <p className="text-5xl sm:text-7xl font-light tracking-tight text-slate-400 mb-2">Verify it.</p>
          <p className="text-5xl sm:text-7xl font-light tracking-tight text-slate-600 mb-12">Drive it.</p>
        </div>

        <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-slate-200 px-10 py-8 text-lg font-semibold transition-all">
          <Link to="/cars">
            Browse vehicles <ArrowRight className="mx-2 h-5 w-5" />
          </Link>
        </Button>

        <div className="mt-32 pt-8 border-t border-slate-800">
          <p className="text-xl font-medium text-white mb-2">AutoConnect</p>
          <p className="text-sm text-slate-500">The trusted way to buy, sell and import vehicles.</p>
        </div>
      </div>
    </section>
  );
}
