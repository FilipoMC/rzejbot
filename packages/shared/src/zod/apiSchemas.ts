import z from "zod";

export const apiResponseSchema = <
  T extends z.ZodType,
  E extends z.ZodType = z.ZodString,
>(
  dataSchema: T,
  errorSchema?: E,
) =>
  z.discriminatedUnion("ok", [
    z.object({
      ok: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      ok: z.literal(false),
      error: errorSchema ?? z.string(),
    }),
  ]);
