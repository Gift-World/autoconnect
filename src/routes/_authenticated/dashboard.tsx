import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  Heart,
  MessageSquare,
  Sparkles,
  PlusCircle,
  QrCode,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck2,
  Lock,
  Layers,
  ChevronRight,
  CheckCircle2,
  Building2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoPersonaSwitcher } from "@/components/DemoPersonaSwitcher";
import { EscrowMilestoneTracker } from "@/components/payments/EscrowMilestoneTracker";
import { YardInventoryManager } from "@/components/yard/YardInventoryManager";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: ConsolidatedDashboard,
});

function ConsolidatedDashboard() {
  const { activeRole, setActiveRole, user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppRole>(activeRole);
  const [showUpgradeModal, setShowUpgradeModal] = useState<"seller" | "yard" | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("KE");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Sync tab with activeRole when role switcher changes
  const currentTab = activeTab || activeRole;

  const handleTabChange = (role: AppRole) => {
    setActiveTab(role);
    setActiveRole(role);
  };

  const handleBecomeSeller = async () => {
    if (!user) return;
    setIsUpgrading(true);
    try {
      // Check if seller record already exists
      const { data: existing } = await supabase
        .from("sellers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("sellers").insert({
          profile_id: user.id,
          business_name: businessName || `${user.email?.split("@")[0]}'s Motors`,
          country: country || "KE",
          seller_type: "dealer",
        });
      }

      await supabase.from("profiles").update({ role: "seller" }).eq("id", user.id);
      await refreshSession();
      setActiveRole("seller");
      setActiveTab("seller");
      setShowUpgradeModal(null);
      toast.success("Welcome to Seller Mode!", {
        description: "Your seller storefront is active. You can now post car listings.",
        icon: <Car className="h-4 w-4 text-primary" />,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleRegisterYard = async () => {
    if (!user) return;
    setIsUpgrading(true);
    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      let sId = seller?.id;
      if (!sId) {
        const { data: newSeller } = await supabase
          .from("sellers")
          .insert({
            profile_id: user.id,
            business_name: businessName || `${user.email?.split("@")[0]} Car Yard`,
            country: country || "KE",
            seller_type: "yard_dealer",
          })
          .select("id")
          .single();
        sId = newSeller?.id;
      }

      if (sId) {
        const baseSlug = (businessName || "car-yard").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await supabase.from("car_yards").insert({
          seller_id: sId,
          name: businessName || "AutoConnect City Car Yard",
          slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
          country: country || "KE",
          city: "Nairobi",
          is_approved: true,
        });
      }

      await refreshSession();
      setActiveRole("yard_manager");
      setActiveTab("yard_manager");
      setShowUpgradeModal(null);
      toast.success("Car Yard Registered!", {
        description: "You are now managing yard parking bays & gate passes.",
        icon: <Store className="h-4 w-4 text-emerald-500" />,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/30 via-background to-background py-6 sm:py-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Consolidated All-in-One Portal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Unified workspace for buyers, verified sellers, yard managers, and escrow administrators.
            </p>
          </div>

          {/* Quick Upgrade / Onboarding CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBusinessName("");
                setShowUpgradeModal("seller");
              }}
              className="h-8 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/5"
            >
              <Car className="h-3.5 w-3.5" /> Become a Seller
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBusinessName("");
                setShowUpgradeModal("yard");
              }}
              className="h-8 gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
            >
              <Store className="h-3.5 w-3.5" /> Register Car Yard
            </Button>
          </div>
        </div>

        {/* 1-Click Interactive Demo Persona Switcher */}
        <DemoPersonaSwitcher />

        {/* Adaptive Consolidated Role Tabs */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange("buyer")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              currentTab === "buyer"
                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <UserIcon className="h-4 w-4 text-purple-500" />
            Buyer Hub
            <Badge variant="secondary" className="text-[10px] ml-1 bg-purple-500/10 text-purple-600">
              Active
            </Badge>
          </button>

          <button
            onClick={() => handleTabChange("seller")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              currentTab === "seller"
                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Car className="h-4 w-4 text-blue-500" />
            Seller Portal
            <Badge variant="secondary" className="text-[10px] ml-1 bg-blue-500/10 text-blue-600">
              Inventory
            </Badge>
          </button>

          <button
            onClick={() => handleTabChange("yard_manager")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              currentTab === "yard_manager"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Store className="h-4 w-4 text-emerald-500" />
            Car Yard Operations
            <Badge variant="secondary" className="text-[10px] ml-1 bg-emerald-500/10 text-emerald-600">
              24 Bays
            </Badge>
          </button>

          <button
            onClick={() => handleTabChange("admin")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              currentTab === "admin"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            Super Admin Console
            <Badge variant="secondary" className="text-[10px] ml-1 bg-amber-500/10 text-amber-600">
              Escrow
            </Badge>
          </button>
        </div>

        {/* Tab 1: Buyer Hub */}
        {currentTab === "buyer" && (
          <div className="space-y-6">
            {/* Live Escrow Order Card */}
            <EscrowMilestoneTracker
              isSimulated
              currentStatus="deposit_paid"
              carTitle="Toyota Land Cruiser Prado TX-L 2021"
              totalAmount="KES 6,250,000"
            />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link
                to="/account/favorites"
                className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Saved Favorites</span>
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">2 Cars</p>
                <span className="text-[11px] text-muted-foreground">Toyota Prado, Benz C200</span>
              </Link>

              <Link
                to="/account/inquiries"
                className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Inquiry Threads</span>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">1 Active</p>
                <span className="text-[11px] text-emerald-600 font-medium">Realtime Live</span>
              </Link>

              <Link
                to="/account/purchases"
                className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Active Orders</span>
                  <Receipt className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">1 Order</p>
                <span className="text-[11px] text-amber-600 font-medium">Deposit Secured</span>
              </Link>

              <Link
                to="/account/verify"
                className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Buyer Identity</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">Verified</p>
                <span className="text-[11px] text-muted-foreground">Level 4 Trust</span>
              </Link>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-card p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  Explore Certified Japanese Imports
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  All listings feature independent 42-point vehicle inspection passports & escrow protection.
                </p>
                <Button asChild size="sm" className="mt-4 bg-primary text-primary-foreground">
                  <Link to="/cars">
                    Browse All Cars <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-500" />
                  Visit Certified Physical Car Yards
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Inspect verified vehicles in-person at physical car yards with digital gate pass check-in.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/yards">
                    Browse Car Yards <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Seller Portal */}
        {currentTab === "seller" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Active Listings</span>
                  <Car className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">15 Cars</p>
                <span className="text-[11px] text-emerald-600 font-medium">All published</span>
              </div>

              <Link
                to="/seller/inquiries"
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Buyer Inquiries</span>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">3 Pending</p>
                <span className="text-[11px] text-primary font-medium">Instant reply ready</span>
              </Link>

              <Link
                to="/seller/transactions"
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Orders in Escrow</span>
                  <Lock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">KES 6.25M</p>
                <span className="text-[11px] text-amber-600 font-medium">Locked in vault</span>
              </Link>

              <Link
                to="/seller/verify"
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Dealer Badge</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-600">Gold Verified</p>
                <span className="text-[11px] text-muted-foreground">Yokohama Exporter</span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5">
              <div>
                <h3 className="text-base font-bold text-foreground">List a New Vehicle</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish Japanese auction cars or local showroom stock with instant Vehicle Passport verification.
                </p>
              </div>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link to="/seller/listings/new">
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Create Car Listing
                </Link>
              </Button>
            </div>

            {/* Seller Links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                to="/seller"
                className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Manage All Listings</h4>
                    <p className="text-[10px] text-muted-foreground">Edit pricing, photos, and specs</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                to="/seller/inspections"
                className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Request Inspections</h4>
                    <p className="text-[10px] text-muted-foreground">Get independent 42-point certification</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                to="/seller/yard"
                className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-purple-500" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Storefront & Yard Setup</h4>
                    <p className="text-[10px] text-muted-foreground">Configure branding and address</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 3: Car Yard Operations */}
        {currentTab === "yard_manager" && (
          <div className="space-y-6">
            <YardInventoryManager yardName="Ngong Road Mega Yard Hub" />
          </div>
        )}

        {/* Tab 4: Platform Admin Console */}
        {currentTab === "admin" && (
          <div className="space-y-6">
            {/* Admin Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link
                to="/admin/verification"
                className="rounded-2xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Car Verifications</span>
                  <FileCheck2 className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">3 Pending</p>
                <span className="text-[11px] text-amber-600 font-medium">Logbooks & NTSA</span>
              </Link>

              <Link
                to="/admin/sellers"
                className="rounded-2xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Seller Audits</span>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">2 KYC Checks</p>
                <span className="text-[11px] text-muted-foreground">Dealer registrations</span>
              </Link>

              <Link
                to="/admin/transactions"
                className="rounded-2xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Escrow Settlements</span>
                  <Lock className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">KES 14.8M</p>
                <span className="text-[11px] text-emerald-600 font-medium">Release console ready</span>
              </Link>

              <Link
                to="/admin/inspections"
                className="rounded-2xl border border-border/80 bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Inspection Reports</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">5 Reviewed</p>
                <span className="text-[11px] text-muted-foreground">42-point checklists</span>
              </Link>
            </div>

            {/* Admin Action Panels */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-card p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Vehicle Passport & Document Verifications
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Audit logbooks, Japanese auction sheets, import duty receipts, and NTSA registration records.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/admin/verification">Open Verification Queue</Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  Escrow Payout Release & Dispute Arbitration
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Review verified handovers and release escrow funds to sellers with automated audit logging.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/admin/transactions">Manage Escrow Orders</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modals */}
        <Dialog open={!!showUpgradeModal} onOpenChange={() => setShowUpgradeModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {showUpgradeModal === "seller" ? (
                  <>
                    <Car className="h-5 w-5 text-blue-500" />
                    Become an AutoConnect Seller / Dealer
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 text-emerald-500" />
                    Register a Physical Car Yard Storefront
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {showUpgradeModal === "seller"
                  ? "Upgrade your existing profile to list vehicles, manage inquiries, and receive secure escrow payouts."
                  : "Register a physical car yard to manage vehicle parking bays, schedule mechanic checks, and issue gate passes."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Business or Storefront Name</Label>
                <Input
                  className="mt-1 text-xs"
                  placeholder={
                    showUpgradeModal === "seller"
                      ? "e.g. Prestige Motors Kenya"
                      : "e.g. Ngong Road Mega Yard"
                  }
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Country of Operation</Label>
                <Input
                  className="mt-1 text-xs"
                  placeholder="Kenya, Japan, United Kingdom, etc."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isUpgrading}
                  onClick={showUpgradeModal === "seller" ? handleBecomeSeller : handleRegisterYard}
                  className="bg-primary text-primary-foreground"
                >
                  {isUpgrading ? "Activating..." : "Activate Now"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
