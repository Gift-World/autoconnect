import { createClient } from "@supabase/supabase-js";

// Publishable values — safe to expose in browser code.
export const SUPABASE_URL = "https://uogmklyvzfneekdlicqf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_uVfP16TXnxpQmn7yDh7dGQ_UeXZ7A_s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
