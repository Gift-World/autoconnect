import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

/* ------------------------------------------------------------------ */
/* 1. AI Smart Search — natural language → structured filter object   */
/* ------------------------------------------------------------------ */

const SmartSearchSchema = z.object({
  q: z.string().optional(),
  country: z.string().length(2).optional(),
  make: z.string().optional(),
  condition: z.enum(["new", "foreign-used", "locally-used"]).optional(),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().nonnegative().optional(),
  minYear: z.number().int().min(1950).max(2030).optional(),
  maxYear: z.number().int().min(1950).max(2030).optional(),
  exportOnly: z.boolean().optional(),
  rhd: z.enum(["left", "right"]).optional(),
});

export const aiSmartSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(400) }).parse(input))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gateway()(MODEL),
      system:
        "You convert a buyer's natural-language car search into structured filters for AutoConnect, a global car marketplace. Use ISO 3166-1 alpha-2 country codes (e.g. 'JP', 'DE', 'US', 'GB', 'KE', 'NG', 'ZA'). 'Make' must be a canonical brand (Toyota, BMW, Mercedes-Benz, Honda, Ford, Hyundai, etc.). Set 'rhd' to 'right' for right-hand-drive countries (Japan, UK, Kenya, South Africa, Australia, India, Nigeria) only if implied. Set exportOnly=true if buyer mentions import/ship/export. Only include fields you are confident about. Put residual descriptive words (color, body type, model name, keyword) in 'q'.",
      prompt: data.query,
      output: Output.object({ schema: SmartSearchSchema }),
    });
    return output;
  });

/* ------------------------------------------------------------------ */
/* 4. Seller listing quality warning                                   */
/* ------------------------------------------------------------------ */

const QualitySchema = z.object({
  readiness: z.enum(["ready", "needs_work", "incomplete"]),
  warnings: z.array(z.string()).max(5),
  tips: z.array(z.string()).max(5),
});

export const aiListingQuality = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string(),
        year: z.number().int(),
        price: z.number(),
        currency: z.string(),
        country: z.string(),
        description: z.string().nullable().optional(),
        photo_count: z.number().int(),
        missing_photos: z.array(z.string()),
        missing_documents: z.array(z.string()),
        rejection_reason: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gateway()(MODEL),
      system:
        "You coach car sellers on AutoConnect (Kenya-first marketplace). Given a listing's data and what is missing, tell the seller in plain, friendly language what could delay approval. 'warnings' are concrete problems (max 5, each under 120 characters). 'tips' are short actions to fix them. 'readiness' is 'ready' when nothing important is missing, 'needs_work' for minor gaps, 'incomplete' when required photos or documents are missing. Never invent facts about the car.",
      prompt: JSON.stringify(data),
      output: Output.object({ schema: QualitySchema }),
    });
    return output;
  });

/* ------------------------------------------------------------------ */
/* 5. Buyer-friendly verification explanation                          */
/* ------------------------------------------------------------------ */

const ExplainSchema = z.object({
  headline: z.string(),
  what_is_checked: z.array(z.string()).max(4),
  what_to_watch: z.array(z.string()).max(4),
  next_step: z.string(),
});

export const aiExplainVerification = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        verificationLevel: z.number().int().min(0).max(4),
        sellerVerified: z.boolean(),
        documentsVerified: z.boolean(),
        ntsaVerified: z.boolean(),
        inspectionDone: z.boolean(),
        inspectionVerdict: z.string().nullable().optional(),
        warnings: z.array(z.string()).max(6),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gateway()(MODEL),
      system:
        "You explain a car's verification status to an ordinary buyer in Kenya. Use very simple, calm language, no jargon, no legal claims, no guarantees. Never promise refunds or say a car is 'fully verified' unless every check passed. 'headline' is one short sentence. 'what_is_checked' lists what AutoConnect already confirmed. 'what_to_watch' lists what is still missing or worth asking about. 'next_step' is one practical sentence telling the buyer what to do next. Keep each item under 110 characters.",
      prompt: JSON.stringify(data),
      output: Output.object({ schema: ExplainSchema }),
    });
    return output;
  });

/* ------------------------------------------------------------------ */
/* 6. Admin document checklist guidance                                */
/* ------------------------------------------------------------------ */

const DocGuidanceSchema = z.object({
  focus: z.array(z.string()).max(5),
  questions_for_seller: z.array(z.string()).max(4),
  summary: z.string().max(400),
});

export const aiDocGuidance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        car_title: z.string(),
        country: z.string(),
        imported: z.boolean().optional(),
        submitted_documents: z.array(z.string()),
        missing_documents: z.array(z.string()),
        seller_verified: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gateway()(MODEL),
      system:
        "You assist an AutoConnect admin reviewing car ownership paperwork (Kenya-first: logbook, NTSA records, import duty, insurance). 'focus' lists what the reviewer should check most carefully on this submission. 'questions_for_seller' are short clarifying questions to send if something is unclear. 'summary' is 1-2 sentences. Be specific and practical; never claim to have seen the documents yourself.",
      prompt: JSON.stringify(data),
      output: Output.object({ schema: DocGuidanceSchema }),
    });
    return output;
  });

/* ------------------------------------------------------------------ */
/* 2. AI Listing Assistant — generate compelling description          */
/* ------------------------------------------------------------------ */

export const aiGenerateDescription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int(),
        mileage: z.number().int().optional(),
        mileage_unit: z.string().optional(),
        transmission: z.string().optional(),
        fuel_type: z.string().optional(),
        body_type: z.string().optional(),
        color: z.string().optional(),
        engine_size: z.string().optional(),
        condition: z.string().optional(),
        country: z.string().optional(),
        features: z.string().max(800).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: gateway()(MODEL),
      system:
        "You are a senior automotive copywriter for AutoConnect. Write trustworthy, factual listing descriptions buyers actually read. Tone: confident, modern, concise. Output ONLY the description as plain text (no markdown headings, no bullet stars, no quotes). 120–180 words. Open with one strong line about the car, then 2 short paragraphs covering condition, key specs, ownership story, and practical buyer notes. End with one line inviting inspection or shipping inquiry. Never invent specs that weren't provided; describe only what's given.",
      prompt: JSON.stringify(data),
    });
    return { description: text.trim() };
  });

/* ------------------------------------------------------------------ */
/* 3. AI Fraud / Quality Scan for admin review                        */
/* ------------------------------------------------------------------ */

const FraudSchema = z.object({
  risk: z.enum(["low", "medium", "high"]),
  score: z.number().int().min(0).max(100),
  signals: z.array(z.string()).max(8),
  recommendation: z.enum(["approve", "review", "reject"]),
  summary: z.string().max(400),
});

export const aiFraudCheck = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string(),
        make: z.string().nullable().optional(),
        model: z.string().nullable().optional(),
        year: z.number().int(),
        price: z.number(),
        currency: z.string(),
        country: z.string(),
        condition: z.string().nullable().optional(),
        mileage: z.number().nullable().optional(),
        description: z.string().nullable().optional(),
        image_count: z.number().int(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gateway()(MODEL),
      system:
        "You are a trust & safety analyst for AutoConnect, a global car marketplace. Score the listing for fraud / quality risk. Consider: price vs market for that year/make/model (suspiciously low = high risk), description quality, vague/copy-paste language, mismatch between title and specs, missing images, unrealistic mileage for the year, urgency/scam phrases ('must sell today', wire transfer, deposit before viewing). 'score' is 0=clean, 100=clearly fraudulent. 'signals' are short reasons (max 8). 'recommendation' is approve (low risk), review (needs human eye), or reject (clear fraud). 'summary' is a 1–2 sentence plain-English explanation for the admin.",
      prompt: JSON.stringify(data),
      output: Output.object({ schema: FraudSchema }),
    });
    return output;
  });

