import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

export const shiftNumberSchema = z.string().regex(/^\d{3}-\d{2}$/);

export const shiftPostSchema = z.object({
  shiftNumber: shiftNumberSchema,
  plannedDate: z.iso
    .datetime({ offset: true })
    .transform((input) => new Date(input)),
  plannedDuration: z.optional(z.int()),
  plannedBriefingDuration: z.optional(z.int()),
  host: snowflakeSchema,
  unit: z.string(),
  shortDesc: z.string().max(1000),
  shiftGoal: z.string(),
  notes: z.string(),
});
