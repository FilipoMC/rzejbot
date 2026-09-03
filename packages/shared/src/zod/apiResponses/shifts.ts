import z from "zod";
import { shiftNumberSchema } from "../shiftSchemas";
import { isoDateStringSchema } from "../dateTimeSchemas";
import { snowflakeSchema } from "../discordSchemas";
import { nameICSchema } from "../employeeSchemas";

export const shiftAPIResponseSchema = z.object({
  id: z.int().nonnegative(),
  shiftNumber: shiftNumberSchema,
  plannedDate: isoDateStringSchema,
  plannedDuration: z.int().nonnegative(),
  plannedBriefingDuration: z.int().nonnegative(),
  unit: z.string().trim().max(10),
  shortDesc: z.string().trim().min(1).max(1000),
  shiftGoal: z.string().trim().max(5000),
  notes: z.string().trim().max(10_000),
  hostId: z.int(),
  host: z.object({
    discordId: snowflakeSchema,
  }),
  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const shiftEmployeeLogAPIResponseSchema = z.object({
  id: z.number().nonnegative(),
  absence: z.boolean().nullable(),
  clockedIn: isoDateStringSchema.nullable(),
  clockedTime: z.int().nonnegative().nullable(),
  exposureTime: z.int().nullable(),
  dose: z.int().nullable(),
  stations: z.array(z.string()),
  rating: z.array(z.string()),
  shiftId: z.int().nonnegative(),
  employeeId: z.int().nonnegative(),
  employee: z.object({
    discordId: snowflakeSchema,
  }),
  shift: z.object({
    shiftNumber: shiftNumberSchema,
  }),
  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const shiftReportAPIResponseSchema = z.object({
  shiftId: z.number().nonnegative(),
  shift: z.object({
    shiftNumber: shiftNumberSchema,
  }),
  date: isoDateStringSchema,
  duration: z.int().nonnegative().nullable(),
  briefingDuration: z.int().nonnegative().nullable(),
  cohostId: z.int().nonnegative().nullable(),
  cohost: z
    .object({
      discordId: snowflakeSchema,
    })
    .nullable(),
  cohostLocation: z.string().nullable(),
  goalMet: z.boolean().nullable(),
  rodBalance: z.enum(["Auto", "Manual", "None"]).nullable(),
  summary: z.string().nullable(),
  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const shiftLogStationsPostAPIResponseSchema = z.array(
  z.union([
    z.object({
      found: z.literal(true),
      employeeDiscordId: snowflakeSchema,
      employeeNameIC: nameICSchema,
    }),
    z.object({
      found: z.literal(false),
      employeeDiscordId: snowflakeSchema,
      employeeNameIC: z.null(),
    }),
    z.object({
      found: z.literal(false),
      employeeDiscordId: z.null(),
      employeeNameIC: nameICSchema,
    }),
  ]),
);
