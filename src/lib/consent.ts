import { supabase } from "@/integrations/supabase/client";

export const TERMS_VERSION = "2026-09-10";

export async function recordConsent(documentType: "terms" | "privacy" | "auction_rules" | "seller_rules" | "payment_rules") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_consents").upsert(
    {
      user_id: user.id,
      document_type: documentType,
      document_version: TERMS_VERSION,
      metadata: { source: "web" },
    },
    { onConflict: "user_id,document_type,document_version", ignoreDuplicates: true },
  );
}
