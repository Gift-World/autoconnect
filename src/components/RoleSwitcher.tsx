import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
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

    // If currently on an authenticated dashboard or login, navigate to the role's home view
    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin") ||
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

  const getBadgeColor = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "seller":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "yard_manager":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "buyer":
      default:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
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
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Switch Account Perspective</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Unified Role
            </Badge>
          </div>
          <p className="mt-1 text-[11px] font-normal text-muted-foreground">
            Test and view the application from any account role without re-logging in.
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

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
        <div className="px-2 py-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Connected: {user?.email || "Guest Preview"}</span>
          <button
            onClick={() => void navigate({ to: roleHomePath(activeRole) as never })}
            className="text-primary hover:underline font-medium"
          >
            Go to {currentRoleInfo.shortLabel} Dashboard →
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
