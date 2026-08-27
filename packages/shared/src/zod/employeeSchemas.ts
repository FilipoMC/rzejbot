import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

export const employeePostSchema = z.object({
  discordId: snowflakeSchema,
  robloxId: z.int().positive(),
  nameIC: z.string().trim().max(100),
  rank: z.string().trim().max(200),
});
