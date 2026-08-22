import { useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Store,
  Warehouse,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface PersonaOption {
  role: AppRole;
  name: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  targetPath: string;
}

const PERSONAS: PersonaOption[] = [
  {
    role: "buyer",
    name: "Alice Mwangi",
    badge: "Buyer / Importer",
    desc: "Saved cars, vehicle inquiries & escrow milestones",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    targetPath: "/account",
  },
  {
    role: "seller",
    name: "Kenji Sato (Yokohama Motors)",
    badge: "Verified Dealer",
    desc: "15 listings, export compliance, price management & chats",
    icon: <Store className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    targetPath: "/seller",
  },
  {
    role: "yard_manager",
    name: "David Ochieng",
    badge: "Yard Admin",
    desc: "42 bays, gate passes, QR scanning & physical intake",
    icon: <Warehouse className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    targetPath: "/seller/yard",
  },
  {
    role: "admin",
    name: "Sarah Kimani",
    badge: "Super Admin",
    desc: "Escrow approvals, dealer KYC verification & dispute console",
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    targetPath: "/admin",
  },
];

export function QuickDemoLogin({
  title = "1-Click Demo & Dev Persona Login",
  subtitle = "Instant access without passwords. Click any persona to simulate their complete dashboard live.",
  redirectAfterLogin = true,
}: {
  title?: string;
  subtitle?: string;
  redirectAfterLogin?: boolean;
}) {
  const { loginAsDemo, activeRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (p: PersonaOption) => {
    loginAsDemo(p.role);
    toast.success(`Switched persona to ${p.name} (${p.badge})`);
    if (redirectAfterLogin) {
      navigate({ to: p.targetPath as any });
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {PERSONAS.map((p) => {
            const isSelected = activeRole === p.role;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSelect(p)}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-muted/60 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/70 bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md border ${p.color}`}>
                      {p.icon}
                    </div>
                    <span className="font-medium text-xs text-foreground">
                      {p.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                    {p.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {p.desc}
                </p>
                <div className="mt-2 flex items-center justify-end text-[11px] font-medium text-primary">
                  <span>Enter as {p.badge}</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
