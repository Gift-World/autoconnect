import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/service-providers")({
  server: {
    handlers: {
      GET: async () => {
        const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabasePublicServer
          .from("service_providers")
          .select("id,name,provider_type,country,city,description,phone,is_verified,owner_id")
          .eq("is_approved", true)
          .order("name");
        if (error) {
          console.error("Error fetching service providers:", error);
          return Response.json(
            { error: "The car-care directory is temporarily unavailable. Please try again." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
        return Response.json(
          {
            data: (data ?? []).map((provider) => {
              const isPreview =
                provider.description?.trim().toLowerCase().startsWith("sample ") ?? false;
              return {
                id: provider.id,
                name: provider.name,
                provider_type: provider.provider_type,
                country: provider.country,
                city: provider.city,
                description: provider.description,
                phone: provider.phone,
                // A preview record must never inherit a real-world trust claim.
                is_verified: Boolean(provider.is_verified && provider.owner_id && !isPreview),
                is_preview: isPreview,
              };
            }),
          },
          { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
        );
      },
    },
  },
});
