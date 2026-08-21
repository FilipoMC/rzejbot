import z from "zod";

export const snowflakeSchema = z
  .string()
  .min(16)
  .max(20)
  .regex(/^[1-9]\d*$/);
