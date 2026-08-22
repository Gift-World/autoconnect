import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
  Layers,
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
import { Badge } from "@/components/ui/badge";
import { useAuth, type AppRole, roleHomePath } from "@/contexts/AuthContext";
import { DEMO_PERSONAS } from "@/components/DemoPersonaSwitcher";

interface RoleSwitcherProps {
  variant?: "navbar" | "compact" | "banner";
  className?: string;
}

export function RoleSwitcher({ variant = "navbar", className = "" }: RoleSwitcherProps) {
  const { activeRole, setActiveRole, availableRoles, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentRoleInfo = availableRoles.find((r) => r.role === activeRole) || availableRoles[0];

  const handleRoleSelect = (role: AppRole) => {
    if (role === activeRole) return;
    setActiveRole(role);
    const targetPath = roleHomePath(role);

    toast.success(`Switched perspective to ${role.replace("_", " ").toUpperCase()}`, {
      description: `Viewing workspace as ${role.replace("_", " ")}`,
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

  const getRoleIcon = (role: AppRole, size = "h-3.5 w-3.5") => {
    switch (role) {
      case "admin":
        return <ShieldCheck className={`${size} text-amber-500`} />;
      case "seller":
        return <Car className={`${size} text-blue-500`} />;
      case "yard_manager":
        return <Store className={`${size} text-emerald-500`} />;
      case "buyer":
      default:
        return <UserIcon className={`${size} text-purple-500`} />;
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
            {getRoleIcon(activeRole)}
            <span className="hidden font-semibold sm:inline">{currentRoleInfo.shortLabel}</span>
            <span className="text-[10px] text-muted-foreground hidden md:inline">View</span>
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Switch Account Mode</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono bg-primary/10 text-primary border-primary/30">
              Consolidated
            </Badge>
          </div>
          <p className="mt-1 text-[11px] font-normal text-muted-foreground">
            Switch perspectives or simulate real test scenarios in 1 click.
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform Perspectives
        </div>
        {availableRoles.map((r) => {
          const isSelected = r.role === activeRole;
          return (
            <DropdownMenuItem
              key={r.role}
              onSelect={() => handleRoleSelect(r.role)}
              className={`flex items-start gap-2.5 rounded-lg p-2 cursor-pointer transition ${
                isSelected ? "bg-primary/10 text-foreground font-medium" : ""
              }`}
            >
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border bg-card">
                {getRoleIcon(r.role, "h-3.5 w-3.5")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                  {r.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>1-Click Test Personas</span>
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-1 p-1">
          {DEMO_PERSONAS.map((dp) => (
            <button
              key={dp.id}
              onClick={() => {
                setActiveRole(dp.role);
                toast.success(`Switched to ${dp.name}`, { description: dp.scenario });
                void navigate({ to: "/dashboard" as never });
              }}
              className="flex flex-col items-start rounded-lg border border-border/70 bg-card p-1.5 text-left hover:border-primary/50 hover:bg-muted/40 transition"
            >
              <span className="text-[11px] font-medium text-foreground truncate w-full">
                {dp.avatarText} · {dp.name.split(" (")[0]}
              </span>
              <span className="text-[9px] text-muted-foreground truncate w-full">{dp.badge}</span>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex items-center justify-between text-[11px] bg-muted/40 rounded-md">
          <span className="text-muted-foreground truncate text-[10px]">
            {user?.email || "Guest"}
          </span>
          <button
            onClick={() => void navigate({ to: "/dashboard" as never })}
            className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
          >
            <Layers className="h-3 w-3" /> All-in-One Portal →
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
