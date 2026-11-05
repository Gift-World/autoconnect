import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  PlusCircle,
  ArrowRight,
  FileCheck2,
  Lock,
  ChevronRight,
  CheckCircle2,
  Gauge,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleImage } from "@/components/VehicleImage";
import {
  NextStepCard,
  SectionHeading,
  ShortcutLink,
  StatRow,
} from "@/components/account/DashboardKit";
import { primaryButton, secondaryButton } from "@/components/account/dashboard-utils";
import { cn } from "@/lib/utils";

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
  useEffect(() => {
    setActiveTab(activeRole);
  }, [activeRole]);

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

  const tabs: { role: AppRole; label: string; badge: string; icon: ReactNode }[] = [
    { role: "buyer", label: "Buyer Hub", badge: "Active", icon: <UserIcon className="h-4 w-4" /> },
    { role: "seller", label: "Seller Portal", badge: "Inventory", icon: <Car className="h-4 w-4" /> },
    {
      role: "yard_manager",
      label: "Car Yard Operations",
      badge: "24 Bays",
      icon: <Store className="h-4 w-4" />,
    },
    {
      role: "admin",
      label: "Super Admin Console",
      badge: "Escrow",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-6 sm:py-8">
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 sm:px-6">
        <PageHeader
          eyebrow="Your workspace"
          title="Consolidated All-in-One Portal"
          description="Unified workspace for buyers, verified sellers, yard managers, and escrow administrators."
          actions={
            <>
              {/* Quick Upgrade / Onboarding CTAs */}
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  setShowUpgradeModal("seller");
                }}
                className={secondaryButton}
              >
                <Car className="h-4 w-4" /> Become a Seller
              </button>
              <button
                type="button"
                onClick={() => {
                  setBusinessName("");
                  setShowUpgradeModal("yard");
                }}
                className={secondaryButton}
              >
                <Store className="h-4 w-4" /> Register Car Yard
              </button>
            </>
          }
        />

        {/* Adaptive Consolidated Role Tabs — scroll inside their own track on small screens */}
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <div
            role="tablist"
            aria-label="Workspace"
            className="inline-flex min-w-max gap-1 rounded-full border border-border bg-card p-1"
          >
            {tabs.map((t) => {
              const selected = currentTab === t.role;
              return (
                <button
                  key={t.role}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleTabChange(t.role)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition",
                    selected
                      ? "bg-ac-ink text-white dark:bg-white dark:text-ac-ink"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className={selected ? "text-ac-accent" : ""}>{t.icon}</span>
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      selected ? "bg-ac-accent text-ac-ink" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Buyer & Owner Hub */}
        {currentTab === "buyer" && (
          <div className="space-y-6">
            {/* Live Escrow Order Card (Active Journey) — what matters now */}
            <EscrowMilestoneTracker
              isSimulated
              currentStatus="deposit_paid"
              carTitle="Toyota Land Cruiser Prado TX-L 2021"
              totalAmount="KES 6,250,000"
            />

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* My Garage Context */}
              <div className="overflow-hidden rounded-[28px] border border-border bg-card">
                <div className="grid sm:grid-cols-[1fr_1.1fr]">
                  <div className="aspect-[16/10] bg-muted sm:aspect-auto sm:h-full">
                    <VehicleImage src={null} alt="Subaru Outback 2019" make="Subaru" model="Outback" year={2019} />
                  </div>
                  <div className="flex flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="brand-kicker text-muted-foreground">My Garage</p>
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        1 Vehicle
                      </span>
                    </div>
                    <p className="font-brand mt-3 text-2xl">Subaru Outback 2019</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Gauge className="h-3.5 w-3.5" /> VIN: SBARU938XNK · 45,000 km
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Insurance Active
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-ac-accent/15 px-2.5 py-1 text-[11px] font-bold text-foreground">
                        <Wrench className="h-3 w-3 text-ac-accent" /> Service Due in 2k km
                      </span>
                    </div>
                    <Link to="/garage" className={cn(primaryButton, "mt-5 w-full sm:mt-auto")}>
                      Open Garage <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Active Journeys / Discovery */}
              <div className="rounded-[28px] border border-border bg-card p-5">
                <p className="brand-kicker flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-ac-accent" /> Explore & Import
                </p>
                <div className="mt-4 space-y-2">
                  <ShortcutLink
                    to="/cars"
                    icon={<Car />}
                    title="Verified Local Inventory"
                    description="Find 42-point inspected vehicles."
                  />
                  <ShortcutLink
                    to="/import"
                    icon={<Sparkles />}
                    title="Import from Japan"
                    description="Let us handle logistics and duty."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Seller Portal */}
        {currentTab === "seller" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <StatRow>
              <MetricCard
                label="Active Listings"
                icon={<Car />}
                value="15 Cars"
                hint="All published"
                tone="ink"
              />
              <MetricCard
                to="/seller/inquiries"
                label="Buyer Inquiries"
                icon={<MessageSquare />}
                value="3 Pending"
                hint="Instant reply ready"
              />
              <MetricCard
                to="/seller/transactions"
                label="Orders in Escrow"
                icon={<Lock />}
                value="KES 6.25M"
                hint="Locked in vault"
              />
              <MetricCard
                to="/seller/verify"
                label="Dealer Badge"
                icon={<ShieldCheck />}
                value="Gold Verified"
                hint="Yokohama Exporter"
              />
            </StatRow>

            {/* Quick Actions */}
            <NextStepCard
              icon={<PlusCircle />}
              title="List a New Vehicle"
              body="Publish Japanese auction cars or local showroom stock with instant Vehicle Passport verification."
              action={
                <Link
                  to="/seller/listings/new"
                  search={{ edit: undefined }}
                  className={primaryButton}
                >
                  <PlusCircle className="h-4 w-4" /> Create Car Listing
                </Link>
              }
            />

            {/* Seller Links */}
            <section>
              <SectionHeading kicker="Manage" title="Seller tools" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <ShortcutLink
                  to="/seller"
                  icon={<Car />}
                  title="Manage All Listings"
                  description="Edit pricing, photos, and specs"
                />
                <ShortcutLink
                  to="/seller/inspections"
                  icon={<FileCheck2 />}
                  title="Request Inspections"
                  description="Get independent 42-point certification"
                />
                <ShortcutLink
                  to="/seller/yard"
                  icon={<Store />}
                  title="Storefront & Yard Setup"
                  description="Configure branding and address"
                />
              </div>
            </section>
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
            <StatRow>
              <MetricCard
                to="/admin/verification"
                label="Car Verifications"
                icon={<FileCheck2 />}
                value="3 Pending"
                hint="Logbooks & NTSA"
                tone="ink"
              />
              <MetricCard
                to="/admin/sellers"
                label="Seller Audits"
                icon={<ShieldCheck />}
                value="2 KYC Checks"
                hint="Dealer registrations"
              />
              <MetricCard
                to="/admin/transactions"
                label="Escrow Settlements"
                icon={<Lock />}
                value="KES 14.8M"
                hint="Release console ready"
              />
              <MetricCard
                to="/admin/inspections"
                label="Inspection Reports"
                icon={<CheckCircle2 />}
                value="5 Reviewed"
                hint="42-point checklists"
              />
            </StatRow>

            {/* Admin Action Panels */}
            <NextStepCard
              icon={<ShieldCheck />}
              kicker="Needs review"
              title="Vehicle Passport & Document Verifications"
              body="Audit logbooks, Japanese auction sheets, import duty receipts, and NTSA registration records."
              action={
                <Link to="/admin/verification" className={primaryButton}>
                  Open Verification Queue <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-ac-accent">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Escrow Payout Release & Dispute Arbitration
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review verified handovers and release escrow funds to sellers with automated
                    audit logging.
                  </p>
                </div>
              </div>
              <Link to="/admin/transactions" className={cn(secondaryButton, "shrink-0")}>
                Manage Escrow Orders
              </Link>
            </div>
          </div>
        )}

        {/* Upgrade Modals */}
        <Dialog open={!!showUpgradeModal} onOpenChange={() => setShowUpgradeModal(null)}>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {showUpgradeModal === "seller" ? (
                  <>
                    <Car className="h-5 w-5 text-ac-accent" />
                    Become an AutoConnect Seller / Dealer
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 text-ac-accent" />
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
                  className="mt-1 h-11"
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
                  className="mt-1 h-11"
                  placeholder="Kenya, Japan, United Kingdom, etc."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="min-h-11 rounded-full"
                  onClick={() => setShowUpgradeModal(null)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  disabled={isUpgrading}
                  onClick={showUpgradeModal === "seller" ? handleBecomeSeller : handleRegisterYard}
                  className={primaryButton}
                >
                  {isUpgrading ? "Activating..." : "Activate Now"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MetricCard({
  to,
  label,
  icon,
  value,
  hint,
  tone = "default",
}: {
  to?: string;
  label: string;
  icon: ReactNode;
  value: string;
  hint: string;
  tone?: "default" | "ink";
}) {
  const ink = tone === "ink";
  const body = (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          ink ? "text-white/65" : "text-muted-foreground",
        )}
      >
        <span className="truncate text-xs font-bold">{label}</span>
        <span className="shrink-0 text-ac-accent [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      </div>
      <p className="font-brand mt-3 truncate text-2xl sm:text-3xl">{value}</p>
      <p className={cn("mt-1.5 flex items-center gap-1 text-xs", ink ? "text-white/65" : "text-muted-foreground")}>
        {hint}
        {to && <ChevronRight className="h-3 w-3" />}
      </p>
    </>
  );
  const cls = cn(
    "min-w-0 rounded-3xl border p-4 sm:p-5",
    ink ? "border-transparent bg-ac-ink text-white" : "border-border bg-card text-foreground",
    to && "transition hover:border-ac-accent/60",
  );
  return to ? (
    <Link to={to as never} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
