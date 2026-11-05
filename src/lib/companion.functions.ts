import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createOpenAiProvider } from "./ai-gateway.server";

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const ReplySchema = z.object({
  reply: z.string(),
  picks: z
    .array(z.object({ carId: z.string(), reason: z.string() }))
    .max(3)
    .describe("Only cars from the inventory list, by exact id. Empty when none fit."),
  searchQuery: z
    .string()
    .optional()
    .describe("A short plain-language search to run on the browse page, when useful."),
  followUps: z.array(z.string()).max(3).describe("Short next questions the buyer might tap."),
});

export type CompanionReply = z.infer<typeof ReplySchema>;

type InventoryCar = {
  id: string;
  title: string;
  year: number | null;
  price: number | null;
  currency: string | null;
  mileage: number | null;
  mileage_unit: string | null;
  body_type: string | null;
  fuel_type: string | null;
  transmission: string | null;
  city: string | null;
  country: string | null;
};

/**
 * The AutoConnect car companion: a conversational guide for choosing, importing,
 * paying for and owning a car. It only recommends cars that are live on the
 * marketplace right now, and never invents verification or prices.
 */
export const aiCarCompanion = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
          .min(1)
          .max(20),
        page: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CompanionReply> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("The AI companion isn't switched on here yet. Set OPENAI_API_KEY on the server.");

    const { supabasePublicServer } = await import("@/integrations/supabase/client.server");
    const { data: cars } = await supabasePublicServer
      .from("cars")
      .select("id,title,year,price,currency,mileage,mileage_unit,body_type,fuel_type,transmission,city,country")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(40);
    const inventory = ((cars ?? []) as InventoryCar[])
      .map(
        (c) =>
          `${c.id} | ${c.title} | ${c.year ?? "?"} | ${c.price ?? "?"} ${c.currency ?? ""} | ${c.mileage ?? "?"} ${c.mileage_unit ?? ""} | ${c.body_type ?? ""} | ${c.fuel_type ?? ""} | ${c.transmission ?? ""} | ${[c.city, c.country].filter(Boolean).join(", ")}`,
      )
      .join("\n");

    const transcript = data.messages.map((m) => `${m.role === "user" ? "Buyer" : "Companion"}: ${m.content}`).join("\n");

    const { output } = await generateText({
      model: createOpenAiProvider(key)(MODEL),
      system: `You are the AutoConnect car companion — a warm, plain-spoken guide for people buying, importing, paying for and owning cars, mostly in Kenya and East Africa.
Rules:
- Keep replies under 110 words. Short sentences. Ask one clarifying question when the need is unclear (budget, seats, use, fuel).
- Only pick cars from the INVENTORY below, by exact id. If none fit, say so and suggest a search instead. Never invent cars, prices, verification or history.
- AutoConnect is a marketplace, not a dealer. Payments follow milestones shown per transaction; evidence (documents, inspections) is shown per listing only when attached. Never promise more than that.
- For import costs, explain the parts (price, shipping, duty, clearing) and point to the import calculator; do not quote exact duty.
- For mechanical or safety questions, give practical checks and say when to see a qualified mechanic.
${data.page ? `The buyer is currently on: ${data.page}` : ""}

INVENTORY (id | title | year | price | mileage | body | fuel | gearbox | location):
${inventory || "(no live listings right now)"}`,
      prompt: transcript,
      output: Output.object({ schema: ReplySchema }),
    });

    const ids = new Set(((cars ?? []) as InventoryCar[]).map((c) => c.id));
    return { ...output, picks: output.picks.filter((p) => ids.has(p.carId)) };
  });
