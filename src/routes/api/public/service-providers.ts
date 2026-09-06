import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/service-providers")({
  server: {
    handlers: {
      GET: async () => {
        const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabasePublicServer
          .from("service_providers")
          .select("id,name,provider_type,country,city,description,phone,is_verified")
          .eq("is_approved", true)
          .order("name");
        if (error) {
          console.error("Error fetching service providers:", error);
          return Response.json(
            { data: [] },
            { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
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
