import z from "zod";
import { snowflakeSchema } from "../discordSchemas";
import { isoDateStringSchema } from "../dateTimeSchemas";
import {
  employeeChangeTypeSchema,
  employeeRanksSchema,
  nameICSchema,
} from "../employeeSchemas";

export const employeeAPIResponseSchema = z.object({
  id: z.number().positive(),
  discordId: snowflakeSchema,
  robloxId: z.number().positive(),
  nameIC: z.string(),
  rank: z.string(),
  qualification: z.object({
    pracownik: z.boolean(),
    jadrowy: z.boolean(),
    kierownikZmiany: z.boolean(),
    szkoleniowiec: z.boolean(),
  }),

  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const employeeWithChangesAPIResponseSchema =
  employeeAPIResponseSchema.extend({
    employeeChanges: z.array(
      z.object({
        issuer: z.object({
          id: z.number().nonnegative(),
          discordId: snowflakeSchema,
          robloxId: z.number(),
          nameIC: nameICSchema,
          rank: employeeRanksSchema,
        }),
        type: employeeChangeTypeSchema,
        reason: z.string().max(500),
        note: z.string().max(250),
        newRole: employeeRanksSchema,
        updatedAt: isoDateStringSchema,
        createdAt: isoDateStringSchema,
      }),
    ),
  });

export const loaAPIResponseSchema = z.object({
  id: z.number().positive(),
  dateStart: isoDateStringSchema,
  duration: z.number().positive(),
  reason: z.string(),
  employeeId: z.number().positive(),
  employee: z.object({
    discordId: snowflakeSchema,
  }),

  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});
