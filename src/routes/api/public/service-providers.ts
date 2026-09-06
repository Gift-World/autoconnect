import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/service-providers")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("service_providers")
          .select("id,name,provider_type,country,city,description,phone,is_verified")
          .eq("is_approved", true)
          .order("name");
        if (error) {
          const code = error.code;
          if (code === "PGRST205" || code === "42P01" || error.message?.includes("does not exist")) {
            return Response.json(
              { data: [] },
              { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
            );
          }
          return Response.json(
            { error: "Service directory is temporarily unavailable." },
            { status: 503 },
          );
        }
        return Response.json(
          { data: data ?? [] },
          { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
        );
      },
    },
  },
});
