import z from "zod";
import { snowflakeSchema } from "./discordSchemas";
import { anyDateSchema } from "./dateTimeSchemas";
import { allRanks, mainRanks, otherRanks } from "../config/ranks";
import { sharedConfig } from "../config/config";
export const nameICSchema = z
  .string()
  .trim()
  .max(100, { error: "Imię pracownika jest za długie (>100)" })
  .regex(/^\S+ \S+$/, {
    error: "Imię pracownika musi być w formacie 'IMIĘ NAZWISKO'",
  });

export const employeeRanksSchema = z.enum(
  Object.keys(mainRanks) as (keyof typeof mainRanks)[],
);

export const allEmployeeRanksSchema = z.enum(
  Object.keys(allRanks) as (keyof typeof allRanks)[],
);

export const otherRanksSchema = z.enum(
  Object.keys(otherRanks) as (keyof typeof otherRanks)[],
);

// warn = uwaga pisemna; strike = nagana
export const employeeChangeTypeSchema = z.enum(
  Object.keys(
    sharedConfig.changeType,
  ) as (keyof typeof sharedConfig.changeType)[],
);

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
  rank: employeeRanksSchema,
  committees: z.array(otherRanksSchema),
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
  committees: z.array(otherRanksSchema).optional(),
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
  newRole: allEmployeeRanksSchema,
  reason: z.string().max(500),
  note: z.string().max(250).optional(),
});
