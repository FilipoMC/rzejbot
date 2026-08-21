import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

export const shiftNumberSchema = z.string().regex(/^\d{3}-\d{2}$/);

export const shiftPostSchema = z.object({
  shiftNumber: shiftNumberSchema,
  date: z.iso.datetime({ offset: true }).transform((input) => new Date(input)),
  duration: z.optional(z.int()),
  briefingDuration: z.optional(z.int()),
  host: snowflakeSchema,
  unit: z.string(),
  shortDesc: z.string().max(1000),
  shiftGoal: z.string(),
  notes: z.string(),
});
