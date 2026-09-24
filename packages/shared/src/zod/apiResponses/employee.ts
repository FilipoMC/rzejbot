import z from "zod";
import { snowflakeSchema } from "../discordSchemas";
import { isoDateStringSchema } from "../dateTimeSchemas";

export const employeeAPIPostResponseSchema = z.object({
  id: z.number().positive(),
  discordId: snowflakeSchema,
  robloxId: z.number().positive(),
  nameIC: z.string(),
  rank: z.string(),

  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});

export const employeeAPIGetResponseSchema = z.object({
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
