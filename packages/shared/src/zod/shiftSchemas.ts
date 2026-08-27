import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateStringSchema } from "./dateTimeSchemas";

export const shiftNumberSchema = z.string().regex(/^\d{3}-\d{2}$/);

export const shiftPostSchema = z.object({
  shiftNumber: shiftNumberSchema,
  plannedDate: anyDateStringSchema,
  plannedDuration: z.int().nonnegative().optional(),
  plannedBriefingDuration: z.int().nonnegative().optional(),
  host: snowflakeSchema,
  unit: z.string().max(10).trim(),
  shortDesc: z.string().trim().min(1).max(1000),
  shiftGoal: z.string().trim().max(5000),
  notes: z.string().trim().max(10_000),
});

export const shiftLogAbsencePostSchema = z.object({
  employeeDiscordId: snowflakeSchema,
});
