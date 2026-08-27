import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftPostSchema,
} from "../zod/shiftSchemas";
import { employeePostSchema } from "../zod/employeeSchemas";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type a<
  T extends z.ZodType,
  E extends z.ZodType = z.ZodString,
> = ApiResponse<z.output<T>, z.output<E>>;

export type ShiftPost = z.infer<typeof shiftPostSchema>;
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type ShiftLogAbsencePost = z.infer<typeof shiftLogAbsencePostSchema>;
