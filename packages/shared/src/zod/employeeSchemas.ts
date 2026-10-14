import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateSchema } from "./dateTimeSchemas";
import config from "../config/config.json";
export const nameICSchema = z
  .string()
  .trim()
  .max(100, { error: "Imię pracownika jest za długie (>100)" })
  .regex(/^\S+ \S+$/, {
    error: "Imię pracownika musi być w formacie 'IMIĘ NAZWISKO'",
  });

export const employeeRanksSchema = z.enum(Object.keys(config.ranks));

// warn = uwaga pisemna; strike = nagana
export const employeeChangeTypeSchema = z.enum([
  "promotion",
  "warn",
  "strike",
  "suspension",
  "demotion",
  "termination",
]);

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
  qualification: z.object({
    create: z.object({
      pracownik: z.boolean().optional(),
      jadrowy: z.boolean().optional(),
      kierownikZmiany: z.boolean().optional(),
      szkoleniowiec: z.boolean().optional(),
    }),
  }),
});

export const employeePatchSchema = z.object({
  discordId: snowflakeSchema.optional(),
  robloxId: z.int().positive().optional(),
  nameIC: nameICSchema.optional(),
  rank: z.string().trim().max(200).optional(),
  qualification: z
    .object({
      update: z.object({
        pracownik: z.boolean().optional(),
        jadrowy: z.boolean().optional(),
        kierownikZmiany: z.boolean().optional(),
        szkoleniowiec: z.boolean().optional(),
      }),
    })
    .optional(),
});

export const loaPostSchema = z.object({
  dateStart: z.optional(anyDateSchema),
  duration: z.int().positive(),
  reason: z.string(),
});

export const employeeWithChangesPostSchema = z.object({
  issuer: z.object({
    connect: z.object({ discordId: snowflakeSchema }),
  }),
  type: employeeChangeTypeSchema,
  newRole: employeeRanksSchema,
  reason: z.string().max(500),
  note: z.string().max(250),
});
