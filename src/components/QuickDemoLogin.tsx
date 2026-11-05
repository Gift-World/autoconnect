import { useNavigate } from "@tanstack/react-router";
import { DEMO_MODE, useAuth, type AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Store, Warehouse, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

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
    color: "bg-ac-powder text-ac-ink",
    targetPath: "/account",
  },
  {
    role: "seller",
    name: "Kenji Sato (Yokohama Motors)",
    badge: "Verified Dealer",
    desc: "15 listings, export compliance, price management & chats",
    icon: <Store className="h-4 w-4" />,
    color: "bg-ac-apricot text-ac-ink",
    targetPath: "/seller",
  },
  {
    role: "yard_manager",
    name: "David Ochieng",
    badge: "Yard Admin",
    desc: "42 bays, gate passes, QR scanning & physical intake",
    icon: <Warehouse className="h-4 w-4" />,
    color: "bg-ac-stone text-ac-ink",
    targetPath: "/seller/yard",
  },
  {
    role: "admin",
    name: "Sarah Kimani",
    badge: "Super Admin",
    desc: "Escrow approvals, dealer KYC verification & dispute console",
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "bg-ac-ink text-white",
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

  if (!DEMO_MODE) return null;

  const handleSelect = (p: PersonaOption) => {
    loginAsDemo(p.role);
    toast.success(`Switched persona to ${p.name} (${p.badge})`);
    if (redirectAfterLogin) {
      navigate({ to: p.targetPath as never });
    }
  };

  return (
    <section
      aria-label={title}
      className="rounded-3xl border border-dashed border-border bg-muted/40 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ac-accent" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {PERSONAS.map((p) => {
          const isSelected = activeRole === p.role;
          return (
            <button
              key={p.role}
              type="button"
              onClick={() => handleSelect(p)}
              aria-pressed={isSelected}
              className={`flex min-h-14 items-start gap-3 rounded-2xl border p-2.5 text-left transition hover:border-foreground/40 ${
                isSelected ? "border-foreground bg-card ring-1 ring-foreground" : "border-border bg-card"
              }`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${p.color}`}>
                {p.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">{p.name}</span>
                <span className="block text-[11px] font-semibold text-foreground/70">
                  Enter as {p.badge}
                </span>
                <span className="block text-[11px] leading-4 text-muted-foreground">{p.desc}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
