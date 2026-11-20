import z from "zod";
import { snowflakeSchema } from "../discordSchemas";
import { isoDateStringSchema } from "../dateTimeSchemas";
import {
  employeeChangeTypeSchema,
  employeeRanksSchema,
  nameICSchema,
  otherRanksSchema,
} from "../employeeSchemas";

export const employeeChangeSchema = z.object({
  issuer: z.object({
    id: z.number().nonnegative(),
    discordId: snowflakeSchema,
    robloxId: z.number(),
    nameIC: nameICSchema,
    committees: z.array(otherRanksSchema),
    system: z.boolean(),
  }),
  id: z.number().nonnegative(),
  type: employeeChangeTypeSchema,
  reason: z.string().max(500),
  note: z.string().max(250).optional(),
  newRole: employeeRanksSchema,
  issuerId: z.number().nonnegative(),
  employeeId: z.number().nonnegative(),
  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const employeeAPIResponseSchema = z.object({
  id: z.number().positive(),
  discordId: snowflakeSchema,
  robloxId: z.number().positive(),
  nameIC: z.string(),
  committees: z.array(otherRanksSchema),
  qualification: z.object({
    pracownik: z.boolean(),
    jadrowy: z.boolean(),
    kierownikZmiany: z.boolean(),
    szkoleniowiec: z.boolean(),
  }),
  employeeChanges: z.union([
    z
      .array(employeeChangeSchema)
      .min(1)
      .transform((change) => {
        return { includedQuals: true, data: change };
      }),
    z
      .array(employeeChangeSchema.pick({ newRole: true }))
      .length(1)
      .transform((e) => {
        return { includedQuals: false, data: e };
      }),
  ]),

  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const employeeWithChangesAPIResponseSchema =
  employeeAPIResponseSchema.extend({
    employeeChanges: z.array(employeeChangeSchema),
  });

export const employeeChangePostAPIResponseSchema = z.object({
  ...employeeChangeSchema.shape,
  employee: employeeAPIResponseSchema,
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
