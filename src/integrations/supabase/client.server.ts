import { createClient } from "@supabase/supabase-js";

const serverUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.APP_SUPABASE_URL ||
  "https://placeholder.supabase.co";

const serviceRoleKey =
  process.env.APP_SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

const publishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.APP_SUPABASE_PUBLISHABLE_KEY ||
  "placeholder-pub-key";

// SERVER-ONLY. Uses the service role key — bypasses RLS.
// Never import this file from client/component code.
export const supabaseAdmin = createClient(
  serverUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// Server-side publishable client (anon role, RLS applies).
export const supabasePublicServer = createClient(
  serverUrl,
  publishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
