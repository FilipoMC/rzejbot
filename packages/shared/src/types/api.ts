import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftPostSchema,
} from "../zod/shiftSchemas";
import { employeePostSchema } from "../zod/employeeSchemas";
import {
  shiftEmployeeLogAPIResponseSchema,
  shiftAPIResponseSchema,
} from "../zod/apiResponses/shifts";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type ShiftPost = z.infer<typeof shiftPostSchema>;
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type ShiftLogAbsencePost = z.infer<typeof shiftLogAbsencePostSchema>;

export type ShiftEmployeeLogAPIResponse = z.infer<
  typeof shiftEmployeeLogAPIResponseSchema
>;
export type ShiftAPIResponse = z.infer<typeof shiftAPIResponseSchema>;
