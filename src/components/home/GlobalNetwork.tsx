import { Globe, ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

const HUBS = [
  { city: "Tokyo & Yokohama", country: "Japan", flag: "🇯🇵", role: "Primary Export Auction Hub", count: "2,400+ Units" },
  { city: "London & Southampton", country: "United Kingdom", flag: "🇬🇧", role: "Luxury RHD Corridor", count: "850+ Units" },
  { city: "Dubai & Jebel Ali", country: "United Arab Emirates", flag: "🇦🇪", role: "GCC Spec & Heavy SUV Hub", count: "1,120+ Units" },
  { city: "Frankfurt & Hamburg", country: "Germany", flag: "🇩🇪", role: "European Executive Network", count: "620+ Units" },
  { city: "Nairobi & Mombasa", country: "Kenya", flag: "🇰🇪", role: "East Africa Direct Clearing", count: "5,200+ Units" },
  { city: "Johannesburg & Durban", country: "South Africa", flag: "🇿🇦", role: "Southern Africa Corridor", count: "480+ Units" },
];

export function GlobalNetwork() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-28 border-t border-border/80">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
            <Globe className="h-3.5 w-3.5" /> Connected Global Marketplace
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Cars without borders.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Source, inspect, buy and clear vehicles across a tightly synchronized international logistics and escrow network.
          </p>
        </div>

        {/* Global Hubs Grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUBS.map((hub) => (
            <div
              key={hub.city}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{hub.flag}</span>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {hub.count}
                  </Badge>
                </div>

                <h3 className="font-display mt-4 text-lg font-bold tracking-tight text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {hub.city}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">{hub.country}</p>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  {hub.role} with verified pre-shipping logistics and continuous customs handling.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Direct Route
                </span>
                <Link
                  to="/cars"
                  className="font-bold text-teal-600 dark:text-teal-400 inline-flex items-center group-hover:translate-x-0.5 transition-transform"
                >
                  Explore <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
