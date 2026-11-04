import { createFileRoute } from "@tanstack/react-router";
import { AutoConnectHome } from "@/components/home/AutoConnectHome";

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
  return <AutoConnectHome />;
}
