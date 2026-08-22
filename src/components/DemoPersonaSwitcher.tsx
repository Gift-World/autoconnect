import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export interface DemoPersona {
  id: string;
  name: string;
  role: AppRole;
  badge: string;
  location: string;
  tagline: string;
  scenario: string;
  avatarText: string;
  icon: typeof UserIcon;
  colorClass: string;
  targetPath: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "buyer-alice",
    name: "Alice Mwangi (First-Time Buyer)",
    role: "buyer",
    badge: "Buyer Mode",
    location: "Nairobi, Kenya",
    tagline: "Browsing Japanese Imports",
    scenario: "2 saved favorites · 1 active inquiry · 1 deposit in escrow",
    avatarText: "AM",
    icon: UserIcon,
    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    targetPath: "/dashboard",
  },
  {
    id: "seller-kenji",
    name: "Kenji Auto Export Ltd (Verified Dealer)",
    role: "seller",
    badge: "Dealer / Seller",
    location: "Yokohama, Japan",
    tagline: "Verified Exporter with 15 Listings",
    scenario: "15 active cars · Gold trust badge · 3 pending buyer inquiries",
    avatarText: "KA",
    icon: Car,
    colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    targetPath: "/dashboard",
  },
  {
    id: "yard-david",
    name: "David Ochieng (Mega Yard Logistics)",
    role: "yard_manager",
    badge: "Yard Admin",
    location: "Ngong Road Hub, Nairobi",
    tagline: "Managing 24 Vehicle Bays & Gate Passes",
    scenario: "24 bays capacity · 8 inspection passes ready · Gate pass generator",
    avatarText: "DO",
    icon: Store,
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    targetPath: "/dashboard",
  },
  {
    id: "admin-sarah",
    name: "Sarah Kimani (Platform Trust Officer)",
    role: "admin",
    badge: "Super Admin",
    location: "AutoConnect Headquarters",
    tagline: "Escrow Moderation & Verification Desk",
    scenario: "3 pending car verifications · 2 seller audits · Escrow release console",
    avatarText: "SK",
    icon: ShieldCheck,
    colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    targetPath: "/dashboard",
  },
];

interface DemoPersonaSwitcherProps {
  compact?: boolean;
  className?: string;
  onSelect?: () => void;
}

export function DemoPersonaSwitcher({
  compact = false,
  className = "",
  onSelect,
}: DemoPersonaSwitcherProps) {
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleSelectPersona = (persona: DemoPersona) => {
    setActiveRole(persona.role);
    if (typeof window !== "undefined") {
      localStorage.setItem("autoconnect_active_persona", persona.id);
    }
    toast.success(`Active Persona: ${persona.name}`, {
      description: persona.scenario,
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    });
    void navigate({ to: persona.targetPath as never });
    onSelect?.();
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            1-Click Demo Personas
          </span>
          <span className="text-[10px] text-muted-foreground">Dev Sim</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DEMO_PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = activeRole === p.role;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p)}
                className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-primary/50 bg-primary/10 shadow-sm"
                    : "border-border/70 bg-card hover:border-primary/30 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${p.colorClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {p.name.split(" (")[0]}
                    </p>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{p.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background p-4 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Demo Persona & Role Simulator
            </h3>
            <p className="text-xs text-muted-foreground">
              Switch in 1-click between realistic buyer, dealer, yard manager, and admin perspectives.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px] font-mono">
          Interactive Dev Mode
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = activeRole === p.role;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${p.colorClass}`}
                  >
                    <Icon className="h-3 w-3" />
                    {p.badge}
                  </span>
                  {isSelected ? (
                    <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
                      Active
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                      Switch →
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-foreground line-clamp-1">{p.name}</h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{p.location}</p>
                <p className="mt-2 text-[10px] text-muted-foreground/90 bg-muted/50 rounded-md p-1.5 line-clamp-2">
                  {p.scenario}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
