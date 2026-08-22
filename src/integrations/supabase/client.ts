import { createClient } from "@supabase/supabase-js";

// Publishable values — safe to expose in browser code. Keep them in the
// deployment environment so each environment can point at its own project.
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || "";
export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("http")
);

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : "https://placeholder.supabase.co",
  isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
