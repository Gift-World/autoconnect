import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const sig = request.headers.get("stripe-signature");
        const body = await request.text();

        const { stripe } = await import("@/lib/stripe.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let event: import("stripe").Stripe.Event;
        try {
          if (secret && sig) {
            event = stripe().webhooks.constructEvent(body, sig, secret);
          } else {
            // Dev fallback when webhook secret not configured yet.
            event = JSON.parse(body) as import("stripe").Stripe.Event;
          }
        } catch (err) {
          return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
        }

        async function notify(uid: string, type: string, title: string, b: string, link?: string) {
          await supabaseAdmin.from("notifications").insert({ user_id: uid, type, title, body: b, link });
        }

        if (event.type === "payment_intent.succeeded") {
          const pi = event.data.object as import("stripe").Stripe.PaymentIntent;
          const txId = pi.metadata?.transaction_id;
          if (!txId) return new Response("ok");

          const { data: tx } = await supabaseAdmin
            .from("transactions")
            .select("id, buyer_id, seller_id, sellers!inner(profile_id), cars!inner(id, title)")
            .eq("id", txId)
            .maybeSingle();

          await supabaseAdmin
            .from("transactions")
            .update({
              status: "payment_received",
              paid_at: new Date().toISOString(),
              stripe_charge_id: typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null,
            })
            .eq("id", txId);

          if (tx) {
            // @ts-expect-error joined
            await supabaseAdmin.from("cars").update({ status: "under_transaction" }).eq("id", tx.cars.id);
            // @ts-expect-error joined
            const carTitle = tx.cars.title;
            await notify(tx.buyer_id, "payment_confirmed", "Payment confirmed", `Your payment for "${carTitle}" is protected and held by AutoConnect until you confirm receipt.`, `/transactions/${tx.id}`);
            // @ts-expect-error joined
            await notify(tx.sellers.profile_id, "payment_received", "A buyer has paid — prepare handover", `Payment for "${carTitle}" is confirmed and held by AutoConnect. Prepare the car and paperwork for handover.`, `/seller/transactions`);
            const { data: admins } = await supabaseAdmin.from("profiles").select("id").eq("role", "admin");
            for (const a of admins ?? []) {
              await notify(a.id, "transaction_new", "New transaction needs review", `Payment received for "${carTitle}". Review and release funds.`, `/admin/transactions`);
            }
          }
        } else if (event.type === "payment_intent.payment_failed") {
          const pi = event.data.object as import("stripe").Stripe.PaymentIntent;
          const txId = pi.metadata?.transaction_id;
          if (txId) {
            await supabaseAdmin
              .from("transactions")
              .update({ status: "cancelled" })
              .eq("id", txId);
          }
        } else if (event.type === "account.updated") {
          const acct = event.data.object as import("stripe").Stripe.Account;
          await supabaseAdmin
            .from("sellers")
            .update({
              stripe_onboarded: acct.details_submitted ?? false,
              stripe_charges_enabled: acct.charges_enabled ?? false,
              stripe_payouts_enabled: acct.payouts_enabled ?? false,
            })
            .eq("stripe_account_id", acct.id);
        }

        return new Response("ok");
      },
    },
  },
});
