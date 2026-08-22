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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  availableRoles: RoleInfo[];
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  // Initialize active role from localStorage or default to buyer
  const [activeRole, setActiveRoleState] = useState<AppRole>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as AppRole | null;
      if (saved && ["buyer", "seller", "yard_manager", "admin"].includes(saved)) {
        return saved;
      }
    }
    return "buyer";
  });

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  };

  useEffect(() => {
    let mounted = true;

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      activeRole,
      setActiveRole,
      availableRoles: ROLE_DEFINITIONS,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        if (user) {
          const p = await fetchProfile(user.id);
          setProfile(p);
        }
      },
    }),
    [user, session, profile, loading, activeRole],
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
