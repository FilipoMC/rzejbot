import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

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
    discordId: null,
    nameIC: z.null(),
  }),
]);

export const employeePostSchema = z.object({
  discordId: snowflakeSchema,
  robloxId: z.int().positive(),
  nameIC: nameICSchema,
  rank: z.string().trim().max(200),
});
