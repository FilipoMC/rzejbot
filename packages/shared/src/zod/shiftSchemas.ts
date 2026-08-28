import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateSchema } from "./dateTimeSchemas";

export const shiftNumberSchema = z.union([
  z.string().regex(/^\d{3}\/\d{2}$/),
  z
    .string()
    .regex(/^\d{3}-\d{2}$/)
    .transform((v) => v.replace("-", "/")),
]);

export const shiftPostSchema = z.object({
  shiftNumber: shiftNumberSchema,
  plannedDate: anyDateSchema,
  plannedDuration: z.int().nonnegative().optional(),
  plannedBriefingDuration: z.int().nonnegative().optional(),
  host: snowflakeSchema,
  unit: z.string().trim().max(10),
  shortDesc: z.string().trim().min(1).max(1000),
  shiftGoal: z.string().trim().max(5000),
  notes: z.string().trim().max(10_000),
});

export const shiftLogAbsencePostSchema = z.object({
  employeeDiscordId: snowflakeSchema,
});
