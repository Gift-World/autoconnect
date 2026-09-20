import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CinematicHero() {
  return (
    <section className="relative w-full bg-white dark:bg-slate-950 pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-4xl font-light text-5xl tracking-tight text-slate-900 dark:text-slate-100 sm:text-7xl">
            Find a car you can <br className="hidden sm:block" /> actually trust.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Verified vehicles. Transparent pricing. Evidence before you buy.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button
              asChild
              className="rounded-full bg-slate-900 dark:bg-slate-100 px-8 py-6 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all"
            >
              <Link to="/cars">
                Explore vehicles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full px-8 py-6 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
            >
              <Link to="/import">
                Import a car
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="relative mt-16 sm:mt-24 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=3269&auto=format&fit=crop"
            alt="Premium SUV driving"
            className="h-full w-full object-cover object-center"
          />
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-multiply" />
          
          {/* Floating badge */}
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Verified vehicle</span>
          </div>
        </div>
      </div>
    </section>
  );
}
