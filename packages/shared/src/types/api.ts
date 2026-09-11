import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftLogStationsPostSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "../zod/shiftSchemas";
import { employeePostSchema } from "../zod/employeeSchemas";
import {
  shiftEmployeeLogAPIResponseSchema,
  shiftAPIResponseSchema,
  shiftReportAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
} from "../zod/apiResponses/shifts";
import { Prettify } from "./utils";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type ShiftPost = z.infer<typeof shiftPostSchema>;
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type ShiftLogAbsencePost = z.infer<typeof shiftLogAbsencePostSchema>;
export type ShiftReportPost = z.infer<typeof shiftReportPostSchema>;
export type ShiftReportPatch = z.infer<typeof shiftReportPatchSchema>;
export type ShiftLogStationsPost = Prettify<
  Omit<z.infer<typeof shiftLogStationsPostSchema>[number], "employee"> & {
    employee: string;
  }
>[];

export type ShiftEmployeeLogAPIResponse = z.infer<
  typeof shiftEmployeeLogAPIResponseSchema
>;
export type ShiftAPIResponse = z.infer<typeof shiftAPIResponseSchema>;
export type ShiftReportAPIResponse = z.infer<
  typeof shiftReportAPIResponseSchema
>;
export type ShiftLogStationsPostAPIResponse = z.infer<
  typeof shiftLogStationsPostAPIResponseSchema
>;
export type ShiftLogStationsGetAPIResponse = z.infer<
  typeof shiftLogStationsGetAPIResponseSchema
>;
