import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key — bypasses RLS.
// Never import this file from client/component code.
export const supabaseAdmin = createClient(
  process.env.APP_SUPABASE_URL!,
  process.env.APP_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// Server-side publishable client (anon role, RLS applies).
export const supabasePublicServer = createClient(
  process.env.APP_SUPABASE_URL!,
  process.env.APP_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
