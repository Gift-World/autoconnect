import { lazy, Suspense, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CinematicHero } from "@/components/home/CinematicHero";

const FeaturedShowroom = lazy(() =>
  import("@/components/home/FeaturedShowroom").then(({ FeaturedShowroom }) => ({
    default: FeaturedShowroom,
  })),
);
const TrustPipeline = lazy(() =>
  import("@/components/home/TrustPipeline").then(({ TrustPipeline }) => ({
    default: TrustPipeline,
  })),
);
const DealershipShowroom = lazy(() =>
  import("@/components/home/DealershipShowroom").then(({ DealershipShowroom }) => ({
    default: DealershipShowroom,
  })),
);
const CinematicImport = lazy(() =>
  import("@/components/home/CinematicImport").then(({ CinematicImport }) => ({
    default: CinematicImport,
  })),
);
const FinalCinematicCTA = lazy(() =>
  import("@/components/home/FinalCinematicCTA").then(({ FinalCinematicCTA }) => ({
    default: FinalCinematicCTA,
  })),
);

function HomeSection({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<div className="min-h-80 animate-pulse bg-muted/20" aria-hidden="true" />}
    >
      {children}
    </Suspense>
  );
}

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
      <HomeSection><FeaturedShowroom /></HomeSection>
      <HomeSection><TrustPipeline /></HomeSection>
      <HomeSection><DealershipShowroom /></HomeSection>
      <HomeSection><CinematicImport /></HomeSection>
      <HomeSection><FinalCinematicCTA /></HomeSection>
    </main>
  );
}
