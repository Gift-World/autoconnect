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

export type AppRole = "admin" | "seller" | "buyer";

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, whatsapp_number, avatar_url, role, country, city, is_suspended",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] fetchProfile error", error);
    return null;
  }
  return (data as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Defer DB call to avoid blocking the auth callback
        setTimeout(() => {
          fetchProfile(sess.user.id).then((p) => {
            if (mounted) setProfile(p);
          });
        }, 0);
      }
    });

    // Then read current session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).then((p) => {
          if (mounted) {
            setProfile(p);
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
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        if (user) setProfile(await fetchProfile(user.id));
      },
    }),
    [user, session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function roleHomePath(role: AppRole | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  return "/account";
}
