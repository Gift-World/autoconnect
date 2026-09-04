import { createFileRoute } from "@tanstack/react-router";
import { CinematicHero } from "@/components/home/CinematicHero";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";
import { TrustPipeline } from "@/components/home/TrustPipeline";
import { DealershipShowroom } from "@/components/home/DealershipShowroom";
import { CinematicImport } from "@/components/home/CinematicImport";
import { FinalCinematicCTA } from "@/components/home/FinalCinematicCTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoConnect — Global Verified Automotive Platform & Escrow" },
      {
        name: "description",
        content:
          "Browse verified vehicles, compare live inventory, and understand the evidence and payment process before you buy or import.",
      },
      { property: "og:title", content: "AutoConnect — Global Verified Automotive Platform & Escrow" },
      {
        property: "og:description",
        content:
          "Find the car. Know the story. Drive with confidence. Browse verified local and import-ready inventory.",
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
      {/* A focused purchase path: search → live inventory → evidence → source/import → action. */}
      <CinematicHero />
      <FeaturedShowroom />
      <TrustPipeline />
      <DealershipShowroom />
      <CinematicImport />
      <FinalCinematicCTA />
    </main>
  );
}
