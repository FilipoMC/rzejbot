import z from "zod";

export const robloxUsersByUsernamesAPIResponseSchema = z.object({
  data: z.array(
    z.object({
      hasVerifiedBadge: z.boolean(),
      id: z.number().positive(),
      name: z.string(),
      displayName: z.string(),
    }),
  ),
});
