import { createFileRoute } from "@tanstack/react-router";
import { CinematicHero } from "@/components/home/CinematicHero";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";
import { TrustPipeline } from "@/components/home/TrustPipeline";
import { CinematicImport } from "@/components/home/CinematicImport";
import { FinalCinematicCTA } from "@/components/home/FinalCinematicCTA";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "AutoConnect — Global Verified Automotive Platform & Escrow" }, { name: "description", content: "Browse verified vehicles, understand the evidence and payment process, and import with confidence." }, { property: "og:title", content: "AutoConnect — Global Verified Automotive Platform & Escrow" }, { property: "og:description", content: "Find a car, understand its story, and manage the next step with confidence." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: HomePage,
});

function HomePage() {
  return <main className="min-h-screen bg-background text-foreground selection:bg-teal-500 selection:text-slate-950"><CinematicHero /><FeaturedShowroom /><TrustPipeline /><CinematicImport /><FinalCinematicCTA /></main>;
}
