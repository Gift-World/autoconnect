import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/parts")({
  server: {
    handlers: {
      GET: async () => {
        const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabasePublicServer
          .from("parts")
          .select("id,title,brand,part_number,category,condition,price,currency,country,city,stock_quantity,shipping_regions,warranty_text,image_url,is_sample,parts_shops(name,slug,is_verified,country)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(48);

        if (error) {
          console.error("Unable to load public parts", error.message);
          return Response.json({ error: "Parts are temporarily unavailable." }, { status: 503 });
        }

        return Response.json({ data: data ?? [] }, {
          headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
        });
      },
    },
  },
});
