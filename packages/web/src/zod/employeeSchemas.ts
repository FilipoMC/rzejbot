import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

export const employeePostSchema = z.object({
  discordId: snowflakeSchema,
  robloxId: z.int(),
  nameIC: z.string(),
  rank: z.string(),
});
