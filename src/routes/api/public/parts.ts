import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/parts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
        const shop = new URL(request.url).searchParams.get("shop");
        let query = supabasePublicServer
          .from("parts")
          .select(
            shop
              ? "id,title,brand,part_number,category,condition,description,price,currency,country,city,stock_quantity,shipping_regions,warranty_text,return_policy,image_url,is_sample,parts_shops!inner(name,slug,is_verified,country,city,shipping_regions,return_policy)"
              : "id,title,brand,part_number,category,condition,price,currency,country,city,stock_quantity,shipping_regions,warranty_text,image_url,is_sample,parts_shops(name,slug,is_verified,country)",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false });
        if (shop) query = query.eq("parts_shops.slug", shop);
        const { data, error } = await query.limit(48);

        if (error) {
          console.error("Unable to load public parts", error.message);
          return Response.json({ error: "Parts are temporarily unavailable." }, { status: 503 });
        }

        return Response.json(
          { data: data ?? [] },
          {
            headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
          },
        );
      },
    },
  },
});
