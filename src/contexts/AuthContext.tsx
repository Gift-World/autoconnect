import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "yard_manager" | "admin";

// Preview personas are explicitly opt-in. They only provide simulated client-side
// identities for navigation and visual QA; Supabase RLS still rejects protected
// reads and every write without a real authenticated session.
export const DEMO_MODE =
  import.meta.env.VITE_ENABLE_DEMO_PERSONAS === "true";

export interface RoleInfo {
  role: AppRole;
  label: string;
  shortLabel: string;
  description: string;
  path: string;
}

export const ROLE_DEFINITIONS: RoleInfo[] = [
  {
    role: "buyer",
    label: "Buyer & Explorer",
    shortLabel: "Buyer",
    description: "Browse cars, saved favorites, inquiries & purchases",
    path: "/account",
  },
  {
    role: "seller",
    label: "Car Seller / Dealer",
    shortLabel: "Seller",
    description: "List cars, manage inventory, docs & inquiries",
    path: "/seller",
  },
  {
    role: "yard_manager",
    label: "Car Yard Admin",
    shortLabel: "Yard Admin",
    description: "Manage yard inventory, bays & gate passes",
    path: "/seller/yard",
  },
  {
    role: "admin",
    label: "Platform Super Admin",
    shortLabel: "Super Admin",
    description: "Verification, seller approvals, moderation & escrow",
    path: "/admin",
  },
];

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  role: AppRole;
  country: string | null;
  city: string | null;
  is_suspended: boolean;
}

export const DEMO_PROFILES: Record<AppRole, { user: User; profile: Profile }> = {
  buyer: {
    user: {
      id: "demo-buyer-alice",
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "Alice Mwangi" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "alice.mwangi@example.com",
      phone: "+254 712 345 678",
      role: "authenticated",
      updated_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "demo-buyer-alice",
      full_name: "Alice Mwangi",
      phone: "+254 712 345 678",
      whatsapp_number: "+254 712 345 678",
      avatar_url: null,
      role: "buyer",
      country: "KE",
      city: "Nairobi",
      is_suspended: false,
    },
  },
  seller: {
    user: {
      id: "demo-seller-kenji",
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "Kenji Sato (Yokohama Motors)" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "kenji@yokohamaexport.jp",
      phone: "+81 90 1234 5678",
      role: "authenticated",
      updated_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "demo-seller-kenji",
      full_name: "Kenji Sato (Yokohama Motors)",
      phone: "+81 90 1234 5678",
      whatsapp_number: "+81 90 1234 5678",
      avatar_url: null,
      role: "seller",
      country: "JP",
      city: "Yokohama",
      is_suspended: false,
    },
  },
  yard_manager: {
    user: {
      id: "demo-yard-david",
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "David Ochieng (Ngong Road Yard)" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "david@megayard.co.ke",
      phone: "+254 722 987 654",
      role: "authenticated",
      updated_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "demo-yard-david",
      full_name: "David Ochieng (Ngong Road Yard)",
      phone: "+254 722 987 654",
      whatsapp_number: "+254 722 987 654",
      avatar_url: null,
      role: "yard_manager",
      country: "KE",
      city: "Nairobi",
      is_suspended: false,
    },
  },
  admin: {
    user: {
      id: "demo-admin-sarah",
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "Sarah Kimani (Trust & Escrow Admin)" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "sarah.kimani@autoconnect.com",
      phone: "+254 700 112 233",
      role: "authenticated",
      updated_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "demo-admin-sarah",
      full_name: "Sarah Kimani (Trust & Escrow Admin)",
      phone: "+254 700 112 233",
      whatsapp_number: "+254 700 112 233",
      avatar_url: null,
      role: "admin",
      country: "KE",
      city: "Nairobi",
      is_suspended: false,
    },
  },
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  loginAsDemo: (role: AppRole) => void;
  availableRoles: RoleInfo[];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = "autoconnect_active_role";

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, whatsapp_number, avatar_url, role, country, city, is_suspended",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[auth] fetchProfile warning", error.message);
      return null;
    }
    return (data as Profile) ?? null;
  } catch (err) {
    console.warn("[auth] fetchProfile exception", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize active role default to buyer for SSR/hydration consistency
  const [activeRole, setActiveRoleState] = useState<AppRole>("buyer");

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
      } catch {
        // Ignore storage errors
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Restore saved role on client mount safely after hydration
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as AppRole | null;
      if (saved && ["buyer", "seller", "yard_manager", "admin"].includes(saved)) {
        setActiveRoleState(saved);
      }
    } catch {
      // Ignore storage errors
    }

    // Listener FIRST (avoids missing initial event)
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === "SIGNED_OUT" || !sess?.user) {
        setProfile(null);
      } else {
        setTimeout(() => {
          fetchProfile(sess.user.id).then((p) => {
            if (mounted && p) {
              setProfile(p);
              // If user hasn't explicitly chosen a role, sync with profile role
              if (
                typeof window !== "undefined" &&
                !localStorage.getItem(ROLE_STORAGE_KEY) &&
                p.role
              ) {
                setActiveRoleState(p.role);
              }
            }
          });
        }, 0);
      }
    });

    // Read current session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).then((p) => {
          if (mounted) {
            if (p) {
              setProfile(p);
              if (
                typeof window !== "undefined" &&
                !localStorage.getItem(ROLE_STORAGE_KEY) &&
                p.role
              ) {
                setActiveRoleState(p.role);
              }
            }
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // A real Supabase session is required outside explicitly enabled local demos.
  const effectiveUser = user ?? (DEMO_MODE ? DEMO_PROFILES[activeRole]?.user : null) ?? null;
  const effectiveProfile =
    profile ?? (DEMO_MODE ? DEMO_PROFILES[activeRole]?.profile : null) ?? null;

  const loginAsDemo = (role: AppRole) => {
    if (!DEMO_MODE) return;
    setActiveRole(role);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
      } catch {
        // Ignore
      }
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      session,
      profile: effectiveProfile,
      loading,
      activeRole,
      setActiveRole,
      loginAsDemo,
      availableRoles: ROLE_DEFINITIONS,
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        setUser(null);
        setSession(null);
        setProfile(null);
        setActiveRoleState("buyer");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(ROLE_STORAGE_KEY);
            localStorage.removeItem("autoconnect_active_persona");
          } catch {
            // ignore
          }
        }
      },
      refreshProfile: async () => {
        if (user) {
          const p = await fetchProfile(user.id);
          setProfile(p);
        }
      },
      refreshSession: async () => {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          const p = await fetchProfile(data.session.user.id);
          setProfile(p);
        }
      },
    }),
    [effectiveUser, session, effectiveProfile, loading, activeRole, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function roleHomePath(role: AppRole | string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  if (role === "yard_manager") return "/seller/yard";
  return "/account";
}
