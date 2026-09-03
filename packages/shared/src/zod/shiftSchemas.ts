import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateSchema } from "./dateTimeSchemas";
import { employeeIdentifierSchema } from "./employeeSchemas";

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

export const shiftReportPostSchema = z.object({
  date: anyDateSchema,
  duration: z.int().nonnegative().optional(),
  briefingDuration: z.int().nonnegative().optional(),
  cohost: snowflakeSchema.optional(),
  cohostLocation: z.string().optional(),
  goalMet: z.boolean().optional(),
  rodBalance: z.enum(["Auto", "Manual", "None"]).optional(),
  summary: z.string().optional(),
});

export const shiftReportPatchSchema = z.object({
  date: anyDateSchema.optional(),
  duration: z.int().nonnegative().nullish(),
  briefingDuration: z.int().nonnegative().nullish(),
  cohost: snowflakeSchema.nullish(),
  cohostLocation: z.string().nullish(),
  goalMet: z.boolean().nullish(),
  rodBalance: z.enum(["Auto", "Manual", "None"]).nullish(),
  summary: z.string().nullish(),
});

export const shiftLogStationsPostSchema = z.array(
  z.object({
    employee: employeeIdentifierSchema,
    station: z.string(),
    date: anyDateSchema.optional(),
  }),
);
