import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/stripe-checkout-premium")({
  server: {
    handlers: {
      POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = z.object({
        carId: z.string().uuid(),
        sellerId: z.string().uuid(),
        returnUrl: z.string().url(),
      }).parse(body);

      const { stripe } = await import("@/lib/stripe.server");
      
      const session = await stripe().checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "AutoConnect Premium Listing Boost",
                description: "Boost your vehicle to the top of search results for 7 days.",
              },
              unit_amount: 1999, // $19.99
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "premium_boost",
          car_id: parsed.carId,
          seller_id: parsed.sellerId,
        },
        success_url: `${parsed.returnUrl}?boost_success=true`,
        cancel_url: `${parsed.returnUrl}?boost_canceled=true`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { "Content-Type": "application/json" },
      });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
    },
  },
}
});
