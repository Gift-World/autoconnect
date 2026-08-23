import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calculateBreakdown, STRIPE_CONNECT_COUNTRIES } from "./stripe-config";

/* ---------- auth helper (verifies access token via service role) ---------- */
async function requireUser(accessToken: string | undefined) {
  if (!accessToken) throw new Error("Not signed in");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Invalid session");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) throw new Error("Profile not found");
  return { user: data.user, profile };
}

async function notify(userId: string, type: string, title: string, body: string, link?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert({ user_id: userId, type, title, body, link });
}

/* ================================================================== */
/* 1. CREATE PAYMENT INTENT                                           */
/* ================================================================== */

export const createPaymentIntent = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      accessToken: z.string(),
      carId: z.string().uuid(),
      paymentPlan: z.enum(["full", "deposit", "installments"]).default("full"),
      amount: z.number().positive().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { user, profile } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripe } = await import("./stripe.server");

    // Fetch car
    const { data: car, error } = await supabaseAdmin
      .from("cars")
      .select(
        "id, title, price, currency, status, seller_id, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_monthly, sellers!inner(id, profile_id, stripe_account_id, stripe_charges_enabled)",
      )
      .eq("id", data.carId)
      .maybeSingle();
    if (error || !car) throw new Error("Car not found");
    if (car.status !== "approved") throw new Error("Car is not available for purchase");
    // @ts-expect-error joined
    if (car.sellers.profile_id === user.id) throw new Error("You cannot buy your own listing");

    // Validate plan is enabled and compute charge amount server-side.
    const price = Number(car.price);
    let chargeAmount = price;
    if (data.paymentPlan === "full") {
      if (car.pay_deposit || car.pay_installments) {
        if (!car.pay_full && !(car.pay_deposit || car.pay_installments === false)) {
          // pay_full defaults true — allow
        }
      }
      chargeAmount = price;
    } else if (data.paymentPlan === "deposit") {
      if (!car.pay_deposit) throw new Error("Deposit not offered for this listing");
      chargeAmount = Math.round((price * Number(car.deposit_percent ?? 20)) / 100 * 100) / 100;
    } else if (data.paymentPlan === "installments") {
      if (!car.pay_installments) throw new Error("Installments not offered for this listing");
      chargeAmount = Number(car.installment_monthly ?? price / Number(car.installment_months ?? 12));
      chargeAmount = Math.round(chargeAmount * 100) / 100;
    }
    const breakdown = calculateBreakdown(chargeAmount, car.currency);

    // Insert pending transaction
    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        car_id: car.id,
        buyer_id: user.id,
        // @ts-expect-error joined
        seller_id: car.sellers.id,
        display_currency: breakdown.currency,
        display_car_price: breakdown.carPrice,
        display_service_fee: breakdown.serviceFee,
        display_total: breakdown.total,
        fx_rate: breakdown.fxRate,
        car_price_usd_cents: breakdown.carPriceUsdCents,
        service_fee_usd_cents: breakdown.serviceFeeUsdCents,
        total_usd_cents: breakdown.totalUsdCents,
        service_fee_percent: breakdown.feePercent,
        // @ts-expect-error joined
        stripe_seller_account_id: car.sellers.stripe_account_id,
        payment_plan: data.paymentPlan,
        plan_amount: chargeAmount,
        status: "pending",
      })
      .select("id")
      .single();
    if (txErr || !tx) throw new Error(txErr?.message ?? "Could not create transaction");

    // Create Stripe PaymentIntent (charge in USD, funds held in platform)
    const pi = await stripe().paymentIntents.create(
      {
        amount: breakdown.totalUsdCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          transaction_id: tx.id,
          car_id: car.id,
          buyer_id: user.id,
          buyer_email: user.email ?? "",
        },
        description: `AutoConnect: ${car.title}`,
      },
      { idempotencyKey: `pi_${tx.id}` },
    );

    await supabaseAdmin
      .from("transactions")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", tx.id);

    return {
      clientSecret: pi.client_secret!,
      transactionId: tx.id,
      breakdown,
      buyerName: profile.full_name ?? user.email ?? "",
    };
  });

/* ================================================================== */
/* 2. CREATE SELLER CONNECT ACCOUNT (+onboarding link)                */
/* ================================================================== */

export const createSellerConnectAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ accessToken: z.string(), origin: z.string().url() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripe } = await import("./stripe.server");

    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("id, country, stripe_account_id, business_name")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!seller) throw new Error("Complete your seller profile first");
    if (!STRIPE_CONNECT_COUNTRIES.has(seller.country.toUpperCase())) {
      throw new Error(
        `Stripe Connect payouts are not available in your country (${seller.country}) yet. Contact support for manual payouts.`,
      );
    }

    let accountId = seller.stripe_account_id;
    if (!accountId) {
      const acct = await stripe().accounts.create({
        type: "express",
        country: seller.country.toUpperCase(),
        email: user.email ?? undefined,
        capabilities: { transfers: { requested: true } },
        business_profile: { name: seller.business_name ?? undefined },
      });
      accountId = acct.id;
      await supabaseAdmin.from("sellers").update({ stripe_account_id: accountId }).eq("id", seller.id);
    }

    const link = await stripe().accountLinks.create({
      account: accountId,
      refresh_url: `${data.origin}/seller?stripe=refresh`,
      return_url: `${data.origin}/seller?stripe=success`,
      type: "account_onboarding",
    });
    return { url: link.url };
  });

export const refreshSellerStripeStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripe } = await import("./stripe.server");

    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("id, stripe_account_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!seller?.stripe_account_id) return { connected: false, charges: false, payouts: false };
    const acct = await stripe().accounts.retrieve(seller.stripe_account_id);
    const onboarded = acct.details_submitted === true;
    await supabaseAdmin
      .from("sellers")
      .update({
        stripe_onboarded: onboarded,
        stripe_charges_enabled: acct.charges_enabled ?? false,
        stripe_payouts_enabled: acct.payouts_enabled ?? false,
      })
      .eq("id", seller.id);
    return {
      connected: true,
      charges: acct.charges_enabled ?? false,
      payouts: acct.payouts_enabled ?? false,
      onboarded,
    };
  });

/* ================================================================== */
/* 3. RELEASE FUNDS (admin only)                                      */
/* ================================================================== */

export const releaseFunds = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ accessToken: z.string(), transactionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { profile } = await requireUser(data.accessToken);
    if (profile.role !== "admin") throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripe } = await import("./stripe.server");

    const { data: tx, error } = await supabaseAdmin
      .from("transactions")
      .select(
        "id, status, car_id, handover_ready_at, payment_method, car_price_usd_cents, stripe_charge_id, stripe_payment_intent_id, stripe_seller_account_id, seller_id, buyer_id, sellers!inner(profile_id, stripe_account_id, stripe_payouts_enabled), cars!inner(title)",
      )
      .eq("id", data.transactionId)
      .maybeSingle();
    if (error || !tx) throw new Error("Transaction not found");
    if (tx.status !== "admin_reviewing")
      throw new Error("Funds can be released only after the buyer confirms receipt");
    if (!tx.handover_ready_at)
      throw new Error("The seller must mark the handover ready before funds are released");

    // @ts-expect-error joined
    const sellerAccount = tx.sellers.stripe_account_id;
    // @ts-expect-error joined
    const payoutsEnabled = tx.sellers.stripe_payouts_enabled;
    let transferId: string | null = null;

    if (tx.payment_method !== "manual" && sellerAccount && payoutsEnabled) {
      const t = await stripe().transfers.create(
        {
          amount: tx.car_price_usd_cents,
          currency: "usd",
          destination: sellerAccount,
          transfer_group: `tx_${tx.id}`,
          metadata: { transaction_id: tx.id },
        },
        { idempotencyKey: `tr_${tx.id}` },
      );
      transferId = t.id;
    }

    await supabaseAdmin
      .from("transactions")
      .update({
        status: "funds_released",
        stripe_transfer_id: transferId,
        released_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    if (tx.car_id) {
      await supabaseAdmin.from("cars").update({ status: "sold" }).eq("id", tx.car_id);
    }

    // Notifications
    // @ts-expect-error joined
    const sellerProfileId = tx.sellers.profile_id;
    // @ts-expect-error joined
    const carTitle = tx.cars.title;
    await notify(
      sellerProfileId,
      "funds_released",
      "Funds released to your account",
      transferId
        ? `Payment for ${carTitle} has been released after verification. Expect payout in 2-5 business days.`
        : `Payment for ${carTitle} approved after verification. AutoConnect will arrange the payout manually.`,
      `/seller/transactions`,
    );
    await notify(
      tx.buyer_id,
      "transaction_complete",
      "Transaction complete",
      `Funds for ${carTitle} were released to the seller after verification.`,
      `/transactions/${tx.id}`,
    );

    return { ok: true, transferId };
  });

/* ================================================================== */
/* 4. REFUND PAYMENT (admin only)                                     */
/* ================================================================== */

export const refundPayment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        transactionId: z.string().uuid(),
        reason: z.string().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { profile } = await requireUser(data.accessToken);
    if (profile.role !== "admin") throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stripe } = await import("./stripe.server");

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, status, stripe_payment_intent_id, buyer_id, seller_id, cars!inner(title), sellers!inner(profile_id), car_id")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Error("Transaction not found");
    if (tx.status === "refunded") throw new Error("Already refunded");

    // Manual (M-Pesa / bank) payments are reversed outside Stripe by the admin.
    let refundId: string | null = null;
    if (tx.stripe_payment_intent_id) {
      const refund = await stripe().refunds.create(
        { payment_intent: tx.stripe_payment_intent_id, reason: "requested_by_customer" },
        { idempotencyKey: `rf_${tx.id}` },
      );
      refundId = refund.id;
    }

    await supabaseAdmin
      .from("transactions")
      .update({
        status: "refunded",
        stripe_refund_id: refundId,
        admin_notes: data.reason,
      })
      .eq("id", tx.id);

    // Re-open the car listing
    await supabaseAdmin.from("cars").update({ status: "approved" }).eq("id", (tx as any).car_id);

    // @ts-expect-error joined
    const sellerProfileId = tx.sellers.profile_id;
    // @ts-expect-error joined
    const carTitle = tx.cars.title;
    await notify(tx.buyer_id, "refund_issued", "Refund issued", `Your payment for ${carTitle} has been refunded. Reason: ${data.reason}`, `/transactions/${tx.id}`);
    await notify(sellerProfileId, "transaction_refunded", "Transaction refunded", `Transaction for ${carTitle} was refunded to the buyer. Reason: ${data.reason}`, `/seller/transactions`);

    return { ok: true, refundId };
  });

/* ================================================================== */
/* 5. BUYER CONFIRM RECEIPT (triggers admin review)                   */
/* ================================================================== */

export const confirmReceipt = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ accessToken: z.string(), transactionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, buyer_id, status, handover_ready_at")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx || tx.buyer_id !== user.id) throw new Error("Not your transaction");
    if (tx.status !== "payment_received") throw new Error("Not ready to confirm");
    if (!tx.handover_ready_at) throw new Error("The seller has not marked the car ready for handover yet");
    await supabaseAdmin
      .from("transactions")
      .update({ status: "admin_reviewing" })
      .eq("id", tx.id);
    return { ok: true };
  });

/* ================================================================== */
/* 6. RAISE DISPUTE                                                   */
/* ================================================================== */

export const raiseDispute = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        transactionId: z.string().uuid(),
        reason: z.string().min(10).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, buyer_id, status, sellers!inner(profile_id), cars!inner(title)")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx || tx.buyer_id !== user.id) throw new Error("Not your transaction");
    await supabaseAdmin
      .from("transactions")
      .update({
        status: "disputed",
        dispute_reason: data.reason,
        disputed_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    // notify all admins
    const { data: admins } = await supabaseAdmin.from("profiles").select("id").eq("role", "admin");
    // @ts-expect-error joined
    const carTitle = tx.cars.title;
    for (const a of admins ?? []) {
      await notify(a.id, "dispute_raised", "URGENT: Dispute raised", `Buyer raised a dispute on "${carTitle}". Review immediately.`, `/admin/transactions`);
    }
    // @ts-expect-error joined
    await notify(tx.sellers.profile_id, "dispute_raised", "Dispute on your sale", `A buyer raised a dispute on "${carTitle}". AutoConnect is investigating.`, `/seller/transactions`);
    return { ok: true };
  });

/* ================================================================== */
/* 7. MANUAL PAYMENT / RESERVATION (M-Pesa or bank transfer)          */
/* ================================================================== */

export const createManualReservation = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        carId: z.string().uuid(),
        paymentPlan: z.enum(["full", "deposit", "installments"]).default("full"),
        channel: z.enum(["mpesa", "bank"]),
        payerName: z.string().min(2).max(120),
        phone: z.string().min(6).max(30),
        reference: z.string().max(120).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user, profile } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: car, error } = await supabaseAdmin
      .from("cars")
      .select(
        "id, title, price, currency, status, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_monthly, sellers!inner(id, profile_id)",
      )
      .eq("id", data.carId)
      .maybeSingle();
    if (error || !car) throw new Error("Car not found");
    if (car.status !== "approved") throw new Error("Car is not available for purchase");
    // @ts-expect-error joined
    if (car.sellers.profile_id === user.id) throw new Error("You cannot buy your own listing");

    const price = Number(car.price);
    let chargeAmount = price;
    if (data.paymentPlan === "deposit") {
      if (!car.pay_deposit) throw new Error("Deposit not offered for this listing");
      chargeAmount = Math.round((price * Number(car.deposit_percent ?? 20)) / 100 * 100) / 100;
    } else if (data.paymentPlan === "installments") {
      if (!car.pay_installments) throw new Error("Installments not offered for this listing");
      chargeAmount =
        Math.round(Number(car.installment_monthly ?? price / Number(car.installment_months ?? 12)) * 100) / 100;
    }
    const breakdown = calculateBreakdown(chargeAmount, car.currency);

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        car_id: car.id,
        buyer_id: user.id,
        // @ts-expect-error joined
        seller_id: car.sellers.id,
        display_currency: breakdown.currency,
        display_car_price: breakdown.carPrice,
        display_service_fee: breakdown.serviceFee,
        display_total: breakdown.total,
        fx_rate: breakdown.fxRate,
        car_price_usd_cents: breakdown.carPriceUsdCents,
        service_fee_usd_cents: breakdown.serviceFeeUsdCents,
        total_usd_cents: breakdown.totalUsdCents,
        service_fee_percent: breakdown.feePercent,
        payment_plan: data.paymentPlan,
        plan_amount: chargeAmount,
        payment_method: "manual",
        manual_channel: data.channel,
        manual_payer_name: data.payerName,
        manual_phone: data.phone,
        manual_reference: data.reference ?? null,
        manual_note: data.note ?? null,
        status: "awaiting_manual_payment",
      })
      .select("id")
      .single();
    if (txErr || !tx) throw new Error(txErr?.message ?? "Could not create reservation");

    const label = data.channel === "mpesa" ? "M-Pesa" : "bank transfer";
    await notify(
      user.id,
      "manual_payment_submitted",
      "Reservation submitted",
      `Your ${label} payment for "${car.title}" is awaiting admin review.`,
      `/transactions/${tx.id}`,
    );
    const { data: admins } = await supabaseAdmin.from("profiles").select("id").eq("role", "admin");
    for (const a of admins ?? []) {
      await notify(
        a.id,
        "manual_payment_review",
        "Manual payment to review",
        `${profile.full_name ?? "A buyer"} submitted a ${label} payment for "${car.title}". Confirm once received.`,
        `/admin/transactions`,
      );
    }

    return { transactionId: tx.id, breakdown, channel: data.channel };
  });

/* ================================================================== */
/* 8. SAFARICOM M-PESA DARAJA 2.0 (DIRECT STK PUSH)                   */
/* ================================================================== */

export const initiateDarajaStkPush = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        carId: z.string().uuid(),
        paymentPlan: z.enum(["full", "deposit", "installments"]).default("full"),
        phone: z.string().min(9).max(20),
        amount: z.number().positive().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user, profile } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendMpesaStkPush, formatKenyanPhone } = await import("./mpesa.server");

    const { data: car, error } = await supabaseAdmin
      .from("cars")
      .select(
        "id, title, price, currency, status, seller_id, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_monthly, sellers!inner(id, profile_id)",
      )
      .eq("id", data.carId)
      .maybeSingle();
    if (error || !car) throw new Error("Car not found");
    if (car.status !== "approved") throw new Error("Car is not available for purchase");
    // @ts-expect-error joined
    if (car.sellers.profile_id === user.id) throw new Error("You cannot buy your own listing");

    const price = Number(car.price);
    let chargeAmount = price;
    if (data.paymentPlan === "deposit") {
      chargeAmount = Math.round((price * Number(car.deposit_percent ?? 20)) / 100 * 100) / 100;
    } else if (data.paymentPlan === "installments") {
      chargeAmount = Number(car.installment_monthly ?? price / Number(car.installment_months ?? 12));
      chargeAmount = Math.round(chargeAmount * 100) / 100;
    }
    const breakdown = calculateBreakdown(chargeAmount, car.currency);

    // KES amount for STK push
    let mpesaKesAmount = breakdown.total;
    if (car.currency.toUpperCase() !== "KES") {
      mpesaKesAmount = Math.round(breakdown.total * (breakdown.fxRate || 130));
    }

    // Insert pending transaction
    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        car_id: car.id,
        buyer_id: user.id,
        // @ts-expect-error joined
        seller_id: car.sellers.id,
        display_currency: breakdown.currency,
        display_car_price: breakdown.carPrice,
        display_service_fee: breakdown.serviceFee,
        display_total: breakdown.total,
        fx_rate: breakdown.fxRate,
        car_price_usd_cents: breakdown.carPriceUsdCents,
        service_fee_usd_cents: breakdown.serviceFeeUsdCents,
        total_usd_cents: breakdown.totalUsdCents,
        service_fee_percent: breakdown.feePercent,
        payment_plan: data.paymentPlan,
        plan_amount: chargeAmount,
        payment_method: "mpesa",
        manual_channel: "mpesa",
        manual_payer_name: profile.full_name ?? user.email ?? "Buyer",
        manual_phone: data.phone,
        status: "pending",
      })
      .select("id")
      .single();

    if (txErr || !tx) throw new Error(txErr?.message ?? "Could not create transaction");

    const formattedPhone = formatKenyanPhone(data.phone);

    // Send M-Pesa STK Push
    const stk = await sendMpesaStkPush({
      phone: formattedPhone,
      amount: mpesaKesAmount,
      accountReference: `AC-${tx.id.slice(0, 8)}`,
      transactionDesc: `AutoConnect: ${car.title}`.slice(0, 13),
    });

    return {
      transactionId: tx.id,
      checkoutRequestId: stk.checkoutRequestId,
      customerMessage: stk.customerMessage,
      formattedPhone,
      kesAmount: mpesaKesAmount,
      mode: stk.mode,
    };
  });

export const checkMpesaPaymentStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        transactionId: z.string().uuid(),
        checkoutRequestId: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { queryMpesaStkPush } = await import("./mpesa.server");

    const result = await queryMpesaStkPush({ checkoutRequestId: data.checkoutRequestId });

    if (result.status === "success") {
      const { data: tx } = await supabaseAdmin
        .from("transactions")
        .select("id, status, car_id, cars!inner(title), sellers!inner(profile_id)")
        .eq("id", data.transactionId)
        .maybeSingle();

      if (tx && tx.status !== "payment_received" && tx.status !== "completed") {
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "payment_received",
            paid_at: new Date().toISOString(),
            manual_reference: result.mpesaReceiptNumber || `MPESA-${Date.now().toString().slice(-6)}`,
          })
          .eq("id", data.transactionId);

        if (tx.car_id) {
          await supabaseAdmin.from("cars").update({ status: "under_transaction" }).eq("id", tx.car_id);
        }

        // @ts-expect-error joined
        const carTitle = tx.cars.title;
        await notify(
          user.id,
          "payment_confirmed",
          "M-Pesa payment received",
          `Your M-Pesa payment for "${carTitle}" was received and held safely in AutoConnect Escrow. Receipt: ${result.mpesaReceiptNumber}.`,
          `/transactions/${tx.id}`,
        );
        await notify(
          // @ts-expect-error joined
          tx.sellers.profile_id,
          "payment_received",
          "Payment received — prepare handover",
          `Payment for "${carTitle}" is confirmed via M-Pesa. Prepare the car and paperwork for handover.`,
          `/seller/transactions`,
        );
      }
    }

    return result;
  });

/* Admin confirms a manual payment was actually received */
export const confirmManualPayment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        transactionId: z.string().uuid(),
        reference: z.string().max(120).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user, profile } = await requireUser(data.accessToken);
    if (profile.role !== "admin") throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, status, payment_method, buyer_id, car_id, cars!inner(title), sellers!inner(profile_id)")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Error("Transaction not found");
    if (tx.payment_method !== "manual") throw new Error("Not a manual payment");
    if (tx.status !== "awaiting_manual_payment") throw new Error(`Cannot confirm in status: ${tx.status}`);

    await supabaseAdmin
      .from("transactions")
      .update({
        status: "payment_received",
        paid_at: new Date().toISOString(),
        manual_confirmed_by: user.id,
        manual_confirmed_at: new Date().toISOString(),
        manual_reference: data.reference ?? undefined,
        admin_notes: data.note ?? undefined,
      })
      .eq("id", tx.id);

    if (tx.car_id) {
      await supabaseAdmin.from("cars").update({ status: "under_transaction" }).eq("id", tx.car_id);
    }

    // @ts-expect-error joined
    const carTitle = tx.cars.title;
    await notify(
      tx.buyer_id,
      "payment_confirmed",
      "Payment confirmed by AutoConnect",
      `Your manual payment for "${carTitle}" was reviewed and confirmed. The seller is preparing handover.`,
      `/transactions/${tx.id}`,
    );
    await notify(
      // @ts-expect-error joined
      tx.sellers.profile_id,
      "payment_received",
      "Payment confirmed — prepare handover",
      `Payment for "${carTitle}" is confirmed and held by AutoConnect. Prepare the car and paperwork for handover.`,
      `/seller/transactions`,
    );
    return { ok: true };
  });

/* Seller marks the car ready for handover */
export const markHandoverReady = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string(),
        transactionId: z.string().uuid(),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, status, buyer_id, cars!inner(title), sellers!inner(profile_id)")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Error("Transaction not found");
    // @ts-expect-error joined
    if (tx.sellers.profile_id !== user.id) throw new Error("Not your sale");
    if (tx.status !== "payment_received") throw new Error("Payment is not confirmed yet");

    await supabaseAdmin
      .from("transactions")
      .update({ handover_ready_at: new Date().toISOString(), handover_notes: data.notes ?? null })
      .eq("id", tx.id);

    // @ts-expect-error joined
    const carTitle = tx.cars.title;
    await notify(
      tx.buyer_id,
      "handover_ready",
      "Your car is ready for handover",
      `The seller marked "${carTitle}" ready for handover. Confirm receipt once you have the car and documents.`,
      `/transactions/${tx.id}`,
    );
    return { ok: true };
  });
