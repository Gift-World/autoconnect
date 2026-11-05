import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, Zap, Building2, ShieldCheck, ArrowRight, Car, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Seller Pricing & Subscription Plans — AutoConnect" }] }),
  component: PricingPage,
});

const TIERS = [
  {
    id: "free",
    name: "Free Tier",
    tagline: "For individual private sellers",
    priceKES: 0,
    priceUSD: 0,
    popular: false,
    features: [
      "Up to 3 active vehicle listings",
      "Standard photo gallery (up to 8 photos)",
      "Standard search placement",
      "Direct buyer WhatsApp & messaging leads",
      "AutoConnect Escrow protection",
    ],
    cta: "Start Free",
    badge: "Basic",
  },
  {
    id: "pro",
    name: "Pro Dealer",
    tagline: "For active car brokers & boutique yards",
    priceKES: 2500,
    priceUSD: 20,
    popular: true,
    features: [
      "Unlimited active vehicle listings",
      "'Featured' badge & top search placement",
      "60-Second Walk-Around Video Uploads",
      "Advanced lead & inquiry analytics",
      "Verified Seller green trust badge",
      "Priority customer concierge support",
    ],
    cta: "Upgrade to Pro",
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise Yard",
    tagline: "For multi-location dealerships & direct importers",
    priceKES: 7500,
    priceUSD: 60,
    popular: false,
    features: [
      "Everything included in Pro Dealer",
      "Dedicated Car Yard Showroom page (/yards/slug)",
      "Direct Japan & Global Import Tracking for customers",
      "Bulk CSV inventory import & sync",
      "Custom API integration & CRM webhooks",
      "Dedicated account manager & yard branding",
    ],
    cta: "Contact Enterprise Sales",
    badge: "Maximum Visibility",
  },
];

const TIER_ICONS = { free: Car, pro: Zap, enterprise: Building2 } as const;

function PricingPage() {
  const { formatPrice } = useCurrency();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(TIERS[1]);
  const [phone, setPhone] = useState("+254 ");
  const [dealershipName, setDealershipName] = useState("");

  const handleUpgradeClick = (tier: (typeof TIERS)[0]) => {
    setSelectedTier(tier);
    setUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeModalOpen(false);
    toast.success(`Upgrade Request Received for ${selectedTier.name}!`, {
      description:
        "Our dealer onboarding specialist will contact you via WhatsApp / Call within 12 hours.",
      icon: <Sparkles className="h-4 w-4 text-teal-400" />,
    });
  };

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 sm:py-20">
        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="brand-kicker text-muted-foreground">Seller monetization & dealer plans</p>
          <h1 className="font-brand mt-4 text-4xl sm:text-6xl">
            Sell more cars with <span className="text-ac-accent">AutoConnect Pro.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Transparent, high-ROI plans built for private sellers, independent auto brokers, and
            premier car dealerships across Kenya and global import markets.
          </p>
        </header>

        {/* Plan cards */}
        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:items-stretch">
          {TIERS.map((tier) => {
            const Icon = TIER_ICONS[tier.id as keyof typeof TIER_ICONS];
            return (
              <article
                key={tier.id}
                aria-label={tier.name}
                className={cn(
                  "relative flex flex-col rounded-[28px] p-6 sm:p-8",
                  tier.popular
                    ? "bg-ac-ink text-white shadow-2xl ring-2 ring-ac-accent lg:-my-3 lg:py-11"
                    : "border border-border bg-card text-foreground",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl",
                      tier.popular ? "bg-ac-accent text-ac-ink" : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      tier.popular
                        ? "bg-ac-accent text-ac-ink"
                        : "border border-border text-muted-foreground",
                    )}
                  >
                    {tier.popular ? "★ Most popular for dealers" : tier.badge}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{tier.name}</h2>
                <p className={cn("mt-1 text-sm", tier.popular ? "text-white/65" : "text-muted-foreground")}>
                  {tier.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  {tier.priceKES === 0 ? (
                    <>
                      <span className="font-brand text-5xl">Free</span>
                      <span className={cn("text-sm", tier.popular ? "text-white/60" : "text-muted-foreground")}>
                        forever
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-brand text-4xl sm:text-5xl">{formatPrice(tier.priceKES)}</span>
                      <span className={cn("text-sm", tier.popular ? "text-white/60" : "text-muted-foreground")}>
                        / month
                      </span>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgradeClick(tier)}
                  className={cn(
                    "mt-6 h-12 w-full gap-2 rounded-full text-sm font-extrabold",
                    tier.popular
                      ? "bg-ac-accent text-ac-ink hover:bg-ac-accent hover:brightness-110"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <ul
                  className={cn(
                    "mt-7 space-y-3 border-t pt-6 text-sm",
                    tier.popular ? "border-white/15" : "border-border",
                  )}
                >
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                          tier.popular ? "bg-ac-accent/20 text-ac-accent" : "bg-muted text-foreground",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className={tier.popular ? "text-white/85" : "text-foreground/85"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Reassurance links */}
        <div className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-2">
          <Link
            to="/how-payments-work"
            className="flex min-h-14 items-center gap-3 rounded-full border border-border bg-card px-5 text-sm font-semibold hover:border-foreground/40"
          >
            <ShieldCheck className="h-4 w-4 text-ac-accent" />
            How buyer payments work
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/support"
            className="flex min-h-14 items-center gap-3 rounded-full border border-border bg-card px-5 text-sm font-semibold hover:border-foreground/40"
          >
            <LifeBuoy className="h-4 w-4 text-ac-accent" />
            Questions about a plan? Get support
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Upgrade Request Dialog */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-ac-accent" />
              Upgrade to {selectedTier.name}
            </DialogTitle>
            <DialogDescription>
              Fill in your dealership details to activate your seller privileges.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpgradeSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="upgrade-business">Dealership / Business Name</Label>
              <Input
                id="upgrade-business"
                value={dealershipName}
                onChange={(e) => setDealershipName(e.target.value)}
                placeholder="e.g. Apex Auto Hub Nairobi"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upgrade-phone">Phone Number (WhatsApp)</Label>
              <Input
                id="upgrade-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="h-11 rounded-xl font-mono"
                required
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm">
              <p className="font-bold text-foreground">Selected Plan: {selectedTier.name}</p>
              <p className="mt-0.5 text-muted-foreground">
                Monthly investment:{" "}
                {selectedTier.priceKES === 0 ? "Free" : formatPrice(selectedTier.priceKES)}
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full gap-2 rounded-full bg-ac-accent font-extrabold text-ac-ink hover:bg-ac-accent hover:brightness-110"
            >
              Submit Upgrade Application
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
