import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/parts-shops")({ server: { handlers: { GET: async () => {
  const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabasePublicServer.from("parts_shops").select("id,slug,name,description,country,city,shipping_regions,return_policy,is_verified,is_sample").eq("is_approved", true).eq("is_suspended", false).order("name");
  if (error) return Response.json({ error: "Supplier directory is temporarily unavailable." }, { status: 503 });
  return Response.json({ data: data ?? [] }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
} } } });
