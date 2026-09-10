import { createFileRoute } from "@tanstack/react-router";
import { CinematicHero } from "@/components/home/CinematicHero";
import { EcosystemLoop } from "@/components/home/EcosystemLoop";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";
import { TrustPipeline } from "@/components/home/TrustPipeline";
import { CinematicImport } from "@/components/home/CinematicImport";
import { FinalCinematicCTA } from "@/components/home/FinalCinematicCTA";
import { LiveMarketplace } from "@/components/home/LiveMarketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoConnect — Find, Buy and Look After Your Car" },
      {
        name: "description",
        content:
          "Browse vehicle listings, understand the evidence shown, and manage the next step for your car.",
      },
      {
        property: "og:title",
        content: "AutoConnect — Find, Buy and Look After Your Car",
      },
      {
        property: "og:description",
        content: "Find a car, understand its story, and manage the next step with confidence.",
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
      <CinematicHero />
      <EcosystemLoop />
      <FeaturedShowroom />
      <LiveMarketplace />
      <TrustPipeline />
      <CinematicImport />
      <FinalCinematicCTA />
    </main>
  );
}
