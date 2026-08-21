import z from "zod";
import snowflake from "./snowflake";

export const shiftPostSchema = z.object({
  shiftNumber: z.string().regex(/\d{3}-\d{2}/),
  date: z.string().transform((input) => new Date(input)),
  duration: z.optional(z.int()),
  briefingDuration: z.optional(z.int()),
  host: snowflake,
  unit: z.string(),
  shortDesc: z.string().max(1000),
  shiftGoal: z.string(),
  notes: z.string(),
});
