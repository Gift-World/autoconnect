import { createFileRoute } from "@tanstack/react-router";

const PREVIEW_OWNER_ID = "f98e074f-e3ad-42e6-9a20-80f55e323045";

export const Route = createFileRoute("/api/public/preview-garage")({ server: { handlers: { GET: async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("garage_vehicles").select("id,nickname,make_name,model_name,year,vin,mileage,mileage_unit,next_service_at,next_service_mileage,insurance_renews_at,notes").eq("owner_id", PREVIEW_OWNER_ID).order("created_at", { ascending: false });
  if (error) return Response.json({ error: "Garage preview is temporarily unavailable." }, { status: 503 });
  return Response.json({ data: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
} } } });
