import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getVehicleRecalls } from "@/lib/nhtsa";

/** Public manufacturer notices only; never a substitute for inspection or ownership evidence. */
export const getPublicRecallNotices = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      make: z.string().trim().min(1).max(80),
      model: z.string().trim().min(1).max(100),
      year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
    }).parse(input),
  )
  .handler(async ({ data }) => getVehicleRecalls(data));
