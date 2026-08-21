import z from "zod";
import { snowflakeSchema } from "./discordSchemas";

export const employeePostSchema = z.object({
  discordID: snowflakeSchema,
  robloxID: z.int(),
  nameIC: z.string(),
  rank: z.string(),
});
