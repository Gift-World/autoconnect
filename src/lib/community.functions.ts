import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createOpenAiProvider } from "./ai-gateway.server";

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const AnswerSchema = z.object({
  answer: z.string(),
  checks: z.array(z.string()).max(5),
  askAProWhen: z.string().optional(),
});

export type CommunityAiAnswer = z.infer<typeof AnswerSchema>;

/**
 * Drafts a helpful first answer to a community question, or summarises a
 * busy thread. Always framed as AI guidance, never as a diagnosis.
 */
export const aiCommunityAssist = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        mode: z.enum(["answer", "summarise"]),
        title: z.string().min(3).max(140),
        body: z.string().max(5000),
        car: z.string().max(120).optional(),
        comments: z.array(z.string().max(2000)).max(40).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CommunityAiAnswer> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("AI is not configured yet. Set OPENAI_API_KEY on the server.");

    const thread = data.comments.length
      ? `\n\nReplies so far:\n${data.comments.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";
    const car = data.car ? `\nVehicle: ${data.car}` : "";

    const { output } = await generateText({
      model: createOpenAiProvider(key)(MODEL),
      system:
        data.mode === "answer"
          ? "You are AutoConnect's community assistant for car owners and buyers, many in Kenya and East Africa. Give a practical, plain-English first answer in under 140 words. List up to 5 concrete things the owner can check themselves. Never claim certainty about a fault you cannot see, never give unsafe repair steps, and say when a qualified mechanic or inspection is needed."
          : "You summarise AutoConnect community threads about cars. In under 110 words, state what was asked, what people agree on, and any open disagreement. List up to 5 key takeaways as checks. Do not add facts that are not in the thread.",
      prompt: `Title: ${data.title}${car}\n\n${data.body}${thread}`,
      output: Output.object({ schema: AnswerSchema }),
    });
    return output;
  });
