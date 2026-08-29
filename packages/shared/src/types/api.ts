import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "../zod/shiftSchemas";
import { employeePostSchema } from "../zod/employeeSchemas";
import {
  shiftEmployeeLogAPIResponseSchema,
  shiftAPIResponseSchema,
  shiftReportAPIResponseSchema,
} from "../zod/apiResponses/shifts";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type ShiftPost = z.infer<typeof shiftPostSchema>;
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type ShiftLogAbsencePost = z.infer<typeof shiftLogAbsencePostSchema>;
export type ShiftReportPost = z.infer<typeof shiftReportPostSchema>;
export type ShiftReportPatch = z.infer<typeof shiftReportPatchSchema>;

export type ShiftEmployeeLogAPIResponse = z.infer<
  typeof shiftEmployeeLogAPIResponseSchema
>;
export type ShiftAPIResponse = z.infer<typeof shiftAPIResponseSchema>;
export type ShiftReportAPIReponse = z.infer<
  typeof shiftReportAPIResponseSchema
>;
