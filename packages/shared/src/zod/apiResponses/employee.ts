import z from "zod";
import { snowflakeSchema } from "../discordSchemas";
import { isoDateStringSchema } from "../dateTimeSchemas";

export const employeeAPIResponseSchema = z.object({
  id: z.number().positive(),
  discordId: snowflakeSchema,
  robloxId: z.number().positive(),
  nameIC: z.string(),
  rank: z.string(),

  updatedAt: isoDateStringSchema,
  createdAt: isoDateStringSchema,
});
