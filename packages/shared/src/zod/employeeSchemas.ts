import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateSchema } from "./dateTimeSchemas";

export const nameICSchema = z
  .string()
  .trim()
  .max(100, { error: "Imię pracownika jest za długie (>100)" })
  .regex(/^\S+ \S+$/, {
    error: "Imię pracownika musi być w formacie 'IMIĘ NAZWISKO'",
  });

export const employeeIdentifierSchema = z.union([
  snowflakeSchema.transform((discordId) => ({
    discordId,
    nameIC: null,
  })),

  nameICSchema.transform((nameIC) => ({
    discordId: null,
    nameIC,
  })),

  z.object({
    discordId: snowflakeSchema,
    nameIC: z.null(),
  }),

  z.object({
    discordId: z.null(),
    nameIC: nameICSchema,
  }),
]);

export const employeePostSchema = z.object({
  discordId: snowflakeSchema,
  robloxId: z.int().positive(),
  nameIC: nameICSchema,
  rank: z.string().trim().max(200),
  qualification: z
    .object({
      pracownik: z.boolean().optional(),
      jadrowy: z.boolean().optional(),
      kierownikZmiany: z.boolean().optional(),
      szkoleniowiec: z.boolean().optional(),
    })
    .optional(),
});

export const loaPostSchema = z.object({
  dateStart: z.optional(anyDateSchema),
  duration: z.int().positive(),
  reason: z.string(),
});
