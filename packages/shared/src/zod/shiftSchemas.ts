import z from "zod";
import { anyDateSchema } from "./dateTimeSchemas";
import { snowflakeSchema } from "./discordSchemas";
import { employeeIdentifierSchema } from "./employeeSchemas";

export const shiftNumberSchema = z.union([
  z.string().regex(
    /^\d{3}\/\d{2}$/,

    { error: "Niepoprawny format numeru zmiany." },
  ),
  z
    .string()
    .regex(/^\d{3}-\d{2}$/, { error: "Niepoprawny format numeru zmiany." })
    .transform((v) => v.replace("-", "/")),
]);

export const shiftPostSchema = z.object({
  shiftNumber: shiftNumberSchema,
  plannedDate: anyDateSchema,
  plannedDuration: z.int().nonnegative().optional(),
  plannedBriefingDuration: z.int().nonnegative().optional(),
  host: snowflakeSchema,
  unit: z.string().trim().max(10),
  shiftGoal: z.string().trim().max(5000),
  notes: z.string().trim().max(10_000),
});

export const shiftPatchSchema = z.object({
  shiftNumber: shiftNumberSchema.optional(),
  plannedDate: anyDateSchema.optional(),
  plannedDuration: z.int().nonnegative().optional(),
  plannedBriefingDuration: z.int().nonnegative().optional(),
  host: snowflakeSchema.optional(),
  unit: z.string().trim().max(10).optional(),
  shiftGoal: z.string().trim().max(5000).optional(),
  notes: z.string().trim().max(10_000).optional(),
  approved: z.boolean().optional(),
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
  summary: z.string().optional(),
});

export const shiftReportPatchSchema = z.object({
  date: anyDateSchema.optional(),
  duration: z.int().nonnegative().nullish(),
  briefingDuration: z.int().nonnegative().nullish(),
  cohost: snowflakeSchema.nullish(),
  cohostLocation: z.string().nullish(),
  goalMet: z.boolean().nullish(),
  summary: z.string().nullish(),
  approved: z.boolean().optional(),
});

export const shiftLogStationsPostSchema = z.array(
  z.object({
    employee: employeeIdentifierSchema,
    station: z.string(),
    date: anyDateSchema.optional(),
  }),
);

export const shiftLogPresenceInitialPostSchema = z.object({
  employees: z.array(employeeIdentifierSchema),
  date: anyDateSchema.optional(),
});

export const shiftLogDosesPostSchema = z.array(
  z.object({
    employee: employeeIdentifierSchema,
    dose: z.int().nonnegative().nullable(),
    time: z.int().nonnegative().nullable(),
  }),
);
