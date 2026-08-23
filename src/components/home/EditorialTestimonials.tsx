import { Star, Quote, ShieldCheck, CheckCircle2 } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "I was skeptical about paying millions upfront for a Japanese import. AutoConnect held my KSh 4.2M in escrow until the Land Cruiser arrived at Mombasa Port and passed the mechanical inspection. The release PIN concept gave me 100% control.",
    author: "Dr. Daniel Mwangi",
    location: "Nairobi, Kenya",
    vehicle: "2022 Toyota Land Cruiser Prado TX-L",
    flag: "🇰🇪",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    verifiedType: "Import Escrow Verified",
  },
  {
    quote:
      "Sold my Mercedes E300 in just 11 days. The buyer paid into escrow, came to view the car at our Karen residence, we did the logbook transfer via NTSA TIMS, and the funds hit my bank account the second he entered his handover code.",
    author: "Fatima Al-Mansoor",
    location: "Mombasa & Dubai",
    vehicle: "2021 Mercedes-Benz E300 AMG Line",
    flag: "🇦🇪",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    verifiedType: "Seller Payout Confirmed",
  },
  {
    quote:
      "The AI vehicle match was shockingly accurate. I typed 'reliable 7-seater SUV under KSh 3.5M for upcountry road trips', and it surfaced 4 verified options with full auction inspection sheets attached. Zero broker nonsense.",
    author: "Brian Kipkorir",
    location: "Eldoret, Kenya",
    vehicle: "2020 Subaru Outback 2.5i Limited",
    flag: "🇰🇪",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    verifiedType: "Direct Buyer Verified",
  },
];

export function EditorialTestimonials() {
  return (
    <section className="bg-secondary/40 py-20 lg:py-28 border-t border-border/80">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
            <Quote className="h-3.5 w-3.5" /> Real Transacting Drivers
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Trusted on every continent.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            See how serious buyers, luxury collectors, and verified dealerships complete multi-million shilling transactions with total peace of mind.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-500/40"
            >
              <div>
                {/* 5-Star Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-6 w-6 text-teal-500/40" />
                </div>

                <blockquote className="mt-6 text-sm leading-relaxed text-foreground font-medium">
                  "{t.quote}"
                </blockquote>
              </div>

              {/* Author and Vehicle Details */}
              <div className="mt-8 pt-6 border-t border-border/60">
                <div className="flex items-center gap-3.5">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-12 w-12 rounded-full object-cover border-2 border-teal-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-sm font-bold text-foreground truncate">
                        {t.author}
                      </p>
                      <span>{t.flag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.location}</p>
                  </div>
                </div>

                {/* Purchased Vehicle Tag */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/80 px-3 py-2 text-[11px]">
                  <span className="font-semibold text-foreground truncate">{t.vehicle}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    <CheckCircle2 className="h-3 w-3" /> {t.verifiedType}
                  </span>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
