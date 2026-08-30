import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, type AppRole, roleHomePath } from "@/contexts/AuthContext";

export const TEST_PERSONAS = [
  {
    id: "buyer-alice",
    role: "buyer" as AppRole,
    name: "Alice Mwangi",
    badge: "Buyer",
    tagline: "First-Time Buyer",
    scenario: "Browsing verified SUVs, comparing specs, and tracking escrow payments.",
    avatarBg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    initials: "AM",
  },
  {
    id: "seller-kenji",
    role: "seller" as AppRole,
    name: "Kenji Sato",
    badge: "Dealer",
    tagline: "Yokohama Auto Export",
    scenario: "Managing stock cars, uploading JEVIC inspection certs, handling inquiries.",
    avatarBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    initials: "KS",
  },
  {
    id: "yard-david",
    role: "yard_manager" as AppRole,
    name: "David Ochieng",
    badge: "Yard Admin",
    tagline: "Nairobi Central Yard",
    scenario: "Scanning gate pass QR codes, assigning parking bays, vehicle inspections.",
    avatarBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    initials: "DO",
  },
  {
    id: "admin-sarah",
    role: "admin" as AppRole,
    name: "Sarah Kimani",
    badge: "Super Admin",
    tagline: "Trust & Escrow Lead",
    scenario: "Approving seller licenses, verifying NTSA logbooks, releasing escrow funds.",
    avatarBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    initials: "SK",
  },
];

const ROLES_LIST: {
  role: AppRole;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}[] = [
  {
    role: "buyer",
    label: "Buyer",
    shortLabel: "Buyer",
    description: "Browse cars, saved favorites, inquiries & orders",
    icon: UserIcon,
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10",
  },
  {
    role: "seller",
    label: "Seller / Dealer",
    shortLabel: "Seller",
    description: "List cars, manage inventory, leads & analytics",
    icon: Car,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
  {
    role: "yard_manager",
    label: "Yard Admin",
    shortLabel: "Yard Admin",
    description: "Yard parking bays, gate passes & QR scanning",
    icon: Store,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
  },
  {
    role: "admin",
    label: "Super Admin",
    shortLabel: "Super Admin",
    description: "Dealer verification, approvals & escrow management",
    icon: ShieldCheck,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
];

interface RoleSwitcherProps {
  className?: string;
  variant?: "navbar" | "compact" | "banner";
}

export function RoleSwitcher({ className = "" }: RoleSwitcherProps) {
  const { activeRole, setActiveRole, user, profile } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showPersonas, setShowPersonas] = useState(false);

  const isDevMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("dev") === "true" ||
      new URLSearchParams(window.location.search).get("personas") === "true" ||
      localStorage.getItem("autoconnect_dev_mode") === "true" ||
      (import.meta as any).env?.VITE_SHOW_TEST_PERSONAS === "true");

  const currentRole = ROLES_LIST.find((r) => r.role === activeRole) || ROLES_LIST[0];
  const CurrentIcon = currentRole.icon;
  const userName = profile?.full_name || (user?.email ? user.email.split("@")[0] : null);

  const handleRoleSelect = (role: AppRole) => {
    if (role === activeRole) return;
    setActiveRole(role);
    const targetPath = roleHomePath(role);

    const matched = ROLES_LIST.find((r) => r.role === role);
    toast.success(`Perspective: ${matched?.label || role} View`, {
      description: `Switched to ${matched?.label || role} view as ${userName || "user"}`,
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    });

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard") ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      void navigate({ to: targetPath as never });
    }
  };

  const handlePersonaSelect = (persona: typeof TEST_PERSONAS[0]) => {
    setActiveRole(persona.role);
    const targetPath = roleHomePath(persona.role);

    toast.success(`Simulating: ${persona.name}`, {
      description: `${persona.tagline} · ${persona.scenario}`,
      icon: <UserCheck className="h-4 w-4 text-primary" />,
    });

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard") ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      void navigate({ to: targetPath as never });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 rounded-full border-border/80 bg-background/80 px-2.5 text-xs font-medium backdrop-blur-sm transition-all hover:bg-muted/80 ${className}`}
        >
          <span className="flex items-center gap-1.5">
            <CurrentIcon className={`h-3.5 w-3.5 ${currentRole.colorClass}`} />
            <span className="font-semibold max-w-[180px] truncate">
              {userName ? `${userName} · ${currentRole.shortLabel} View` : `${currentRole.shortLabel} View`}
            </span>
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 shadow-2xl border-border rounded-2xl">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs">
          <span className="font-bold text-foreground">Switch Perspective</span>
          <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
            Select a role to view the workspace from that point of view.
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        {/* 4 Core Roles */}
        <div className="space-y-0.5">
          {ROLES_LIST.map((r) => {
            const isSelected = r.role === activeRole;
            const Icon = r.icon;
            return (
              <DropdownMenuItem
                key={r.role}
                onSelect={() => handleRoleSelect(r.role)}
                className={`flex items-start gap-2.5 rounded-xl p-2 cursor-pointer transition ${
                  isSelected ? "bg-primary/10 text-foreground font-semibold" : "hover:bg-muted/60"
                }`}
              >
                <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border/60 ${r.bgClass}`}>
                  <Icon className={`h-4 w-4 ${r.colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{r.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {r.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        {/* Dev/Demo Only: Collapsible Test Personas Section */}
        {isDevMode && (
          <>
            <DropdownMenuSeparator className="my-1.5" />
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPersonas((prev) => !prev);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Test Personas (4) [Dev Mode]</span>
                </span>
                {showPersonas ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {showPersonas && (
                <div className="mt-1 space-y-1 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {TEST_PERSONAS.map((p) => {
                    const isSelected = activeRole === p.role;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePersonaSelect(p)}
                        className={`w-full flex items-center justify-between rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-primary/50 bg-primary/5 font-medium"
                            : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[10px] font-bold ${p.avatarBg}`}>
                            {p.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground truncate">{p.name}</span>
                              <span className="text-[9px] font-medium text-muted-foreground">· {p.badge}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{p.tagline}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
