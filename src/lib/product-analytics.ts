import { supabase } from "@/integrations/supabase/client";

/**
 * Records a privacy-conscious product event for signed-in users. Analytics
 * must never interrupt a customer action, so errors are intentionally ignored.
 */
export async function trackProductEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("product_events").insert({
    user_id: user.id,
    event_name: eventName,
    properties,
  });
}
