import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex items-center justify-center bg-background px-4 py-24 sm:py-32">
      <div className="max-w-xl text-center">
        <div className="text-6xl mb-4">🚗💨</div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Looks like we took a wrong turn</h2>
        <p className="mt-2 text-base text-muted-foreground">
          The page you're looking for has moved, been deleted, or doesn't exist. Let's get you back on the road.
        </p>
        
        <div className="mt-8">
          <form action="/cars" method="get" className="flex gap-2 max-w-md mx-auto">
            <input 
              type="text" 
              name="q" 
              placeholder="Search for a make or model..." 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Search
            </button>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/cars"
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <span className="block font-semibold">Browse Cars</span>
            <span className="text-xs text-muted-foreground mt-1 block">View all local stock</span>
          </Link>
          <Link
            to="/import"
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <span className="block font-semibold">Import a Vehicle</span>
            <span className="text-xs text-muted-foreground mt-1 block">Global stock direct</span>
          </Link>
          <Link
            to="/yards"
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <span className="block font-semibold">View Dealerships</span>
            <span className="text-xs text-muted-foreground mt-1 block">Verified sellers</span>
          </Link>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AutoConnect — Buy and Import Cars, Worldwide" },
      {
        name: "description",
        content:
          "Browse verified car listings from sellers across the globe. Buy locally or import directly — no brokers.",
      },
      { name: "author", content: "AutoConnect" },
      { property: "og:title", content: "AutoConnect — Buy and Import Cars, Worldwide" },
      {
        property: "og:description",
        content:
          "Browse verified car listings from sellers across the globe. Buy locally or import directly — no brokers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AutoConnect — Buy and Import Cars, Worldwide" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/24cb9047-9c2c-41bd-8be9-bda69e6877f4/id-preview-39606995--f0ca1fc7-6e2f-4a04-8f98-07bbcbc836cb.lovable.app-1782567921428.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/24cb9047-9c2c-41bd-8be9-bda69e6877f4/id-preview-39606995--f0ca1fc7-6e2f-4a04-8f98-07bbcbc836cb.lovable.app-1782567921428.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { CompareFloatingBar } from "@/components/compare/CompareFloatingBar";
import { WhatsAppConcierge } from "@/components/concierge/WhatsAppConcierge";
import { PersonaControlDock } from "@/components/dock/PersonaControlDock";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <ComparisonProvider>
            <div className="flex min-h-screen flex-col bg-background">
              <Navbar />
              <main className="flex-1">
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </main>
              <Footer />
            </div>
            <CompareFloatingBar />
            <WhatsAppConcierge />
            <PersonaControlDock />
            <Toaster richColors position="top-right" />
          </ComparisonProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

