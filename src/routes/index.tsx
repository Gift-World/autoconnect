import { createFileRoute } from "@tanstack/react-router";
import { CinematicHero } from "@/components/home/CinematicHero";
import { SpotlightDiscovery } from "@/components/home/SpotlightDiscovery";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";
import { AIMatchExperience } from "@/components/home/AIMatchExperience";
import { DealershipShowroom } from "@/components/home/DealershipShowroom";
import { CinematicImport } from "@/components/home/CinematicImport";
import { TrustPipeline } from "@/components/home/TrustPipeline";
import { EscrowSecurity } from "@/components/home/EscrowSecurity";
import { GlobalNetwork } from "@/components/home/GlobalNetwork";
import { EditorialTestimonials } from "@/components/home/EditorialTestimonials";
import { FinalCinematicCTA } from "@/components/home/FinalCinematicCTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoConnect — Global Verified Automotive Platform & Escrow" },
      {
        name: "description",
        content:
          "The premium global automotive platform. Verified vehicles, direct import corridors from Japan/UK/UAE, AI-powered matching, and 100% escrow buyer protection.",
      },
      { property: "og:title", content: "AutoConnect — Global Verified Automotive Platform & Escrow" },
      {
        property: "og:description",
        content:
          "Find the car. Know the story. Drive with confidence. Buy locally or import globally with guaranteed escrow protection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-teal-500 selection:text-slate-950">
      {/* 1. Hero: Cinematic Moving Vehicle + Integrated Search + AI Prompt */}
      <CinematicHero />

      {/* 2. Spotlight: Large Flagship Showcase (Prado / Luxury SUV) */}
      <SpotlightDiscovery />

      {/* 3. Curated Digital Showroom: Featured Filterable Stock */}
      <FeaturedShowroom />

      {/* 4. AI Match Experience: Natural language vehicle matcher with live scoring */}
      <AIMatchExperience />

      {/* 5. Dealership Showroom: Accredited Car Yards & Lots */}
      <DealershipShowroom />

      {/* 6. Cinematic Import: International corridors (Japan, UK, UAE, Germany) */}
      <CinematicImport />

      {/* 7. Trust Pipeline: 6-stage vehicle verification infrastructure */}
      <TrustPipeline />

      {/* 8. Escrow Security: Visual flow of protected buyer funds */}
      <EscrowSecurity />

      {/* 9. Global Network: Connected hubs worldwide */}
      <GlobalNetwork />

      {/* 10. Editorial Testimonials: Authentic transacting buyers & dealers */}
      <EditorialTestimonials />

      {/* 11. Final Cinematic CTA: High-impact closure */}
      <FinalCinematicCTA />
    </main>
  );
}
