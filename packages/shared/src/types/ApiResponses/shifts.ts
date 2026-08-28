import z from "zod";
import { shiftNumberSchema } from "../../zod/shiftSchemas";
import { isoDateStringSchema } from "../../zod/dateTimeSchemas";
import { snowflakeSchema } from "../../zod/discordSchemas";

export const ShiftAPIResponseSchema = z.object({
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
  host: {
    discordId: snowflakeSchema,
  },
});

export const ShiftEmployeeAbsenceAPIResponseSchema = z.object({
  id: z.number().nonnegative(),
  absence: z.boolean(),
  clockedIn: z.date(),
  clockedTime: z.int().nonnegative(),
  exposureTime: z.int(),
  dose: z.int(),
  stations: z.array(z.string()),
  rating: z.array(z.string()),
  shiftId: z.int().nonnegative(),
  employeeId: z.int().nonnegative(),
});

export type ShiftEmployeeAbsenceAPIResponse = z.infer<
  typeof ShiftEmployeeAbsenceAPIResponseSchema
>;
export type ShiftAPIResponse = z.infer<typeof ShiftAPIResponseSchema>;
