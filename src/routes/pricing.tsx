import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Video,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      "✨ 'Featured' badge & top search placement",
      "📹 60-Second Walk-Around Video Uploads",
      "📊 Advanced lead & inquiry analytics",
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
      "🏢 Dedicated Car Yard Showroom page (/yards/slug)",
      "🚢 Direct Japan & Global Import Tracking for customers",
      "📁 Bulk CSV inventory inventory import & sync",
      "⚡ Custom API integration & CRM webhooks",
      "Dedicated account manager & yard branding",
    ],
    cta: "Contact Enterprise Sales",
    badge: "Maximum Visibility",
  },
];

function PricingPage() {
  const { formatPrice } = useCurrency();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(TIERS[1]);
  const [phone, setPhone] = useState("+254 ");
  const [dealershipName, setDealershipName] = useState("");

  const handleUpgradeClick = (tier: typeof TIERS[0]) => {
    setSelectedTier(tier);
    setUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeModalOpen(false);
    toast.success(`Upgrade Request Received for ${selectedTier.name}!`, {
      description: "Our dealer onboarding specialist will contact you via WhatsApp / Call within 12 hours.",
      icon: <Sparkles className="h-4 w-4 text-teal-400" />,
    });
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 space-y-12">
      {/* Top Hero Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-mono font-bold">
          <Zap className="h-3.5 w-3.5" /> SELLER MONETIZATION & DEALER PLANS
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Sell More Cars with <span className="text-teal-500">AutoConnect Pro</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Transparent, high-ROI plans built for private sellers, independent auto brokers, and premier car dealerships across Kenya and global import markets.
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
              tier.popular
                ? "border-2 border-teal-500 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950/40 shadow-2xl shadow-teal-500/10 scale-105"
                : "border border-border bg-card shadow-sm hover:border-teal-500/40"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-teal-500 text-slate-950 font-black text-xs px-3 py-0.5 shadow-md">
                  ★ MOST POPULAR FOR DEALERS
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tier.tagline}</p>
              </div>

              {/* Price display */}
              <div className="pt-2">
                {tier.priceKES === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">Free</span>
                    <span className="text-xs text-muted-foreground">forever</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-teal-400 font-mono">
                      {formatPrice(tier.priceKES)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 pt-3 border-t border-border/80 text-xs">
                {tier.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => handleUpgradeClick(tier)}
                className={`w-full h-11 rounded-xl font-bold text-xs gap-1.5 shadow-md ${
                  tier.popular
                    ? "bg-teal-500 text-slate-950 hover:bg-teal-400"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Request Dialog */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal-400" />
              Upgrade to {selectedTier.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in your dealership details to activate your seller privileges.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpgradeSubmit} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Dealership / Business Name</Label>
              <Input
                value={dealershipName}
                onChange={(e) => setDealershipName(e.target.value)}
                placeholder="e.g. Apex Auto Hub Nairobi"
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number (WhatsApp)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="h-11 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-muted-foreground">
              <p className="font-bold text-teal-400">Selected Plan: {selectedTier.name}</p>
              <p className="text-[11px] mt-0.5">
                Monthly investment: {selectedTier.priceKES === 0 ? "Free" : formatPrice(selectedTier.priceKES)}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2"
            >
              Submit Upgrade Application
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
