import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftLogStationsPostSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "../zod/shiftSchemas";
import { employeePostSchema, loaPostSchema } from "../zod/employeeSchemas";
import {
  shiftEmployeeLogAPIResponseSchema,
  shiftAPIResponseSchema,
  shiftReportAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
} from "../zod/apiResponses/shifts";
import { Prettify } from "./utils";
import {
  employeeAPIResponseSchema,
  loaAPIResponseSchema,
} from "../zod/apiResponses/employee";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// #region shift types
export type ShiftPost = z.infer<typeof shiftPostSchema>;

export type ShiftReportPost = z.infer<typeof shiftReportPostSchema>;
export type ShiftReportPatch = z.infer<typeof shiftReportPatchSchema>;

export type ShiftLogAbsencePost = z.infer<typeof shiftLogAbsencePostSchema>;
export type ShiftLogStationsPost = Prettify<
  Omit<z.infer<typeof shiftLogStationsPostSchema>[number], "employee"> & {
    employee: string;
  }
>[];
// #endregion
// #region shift api response types
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
// #endregion
// #region employee types
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type LoaPost = z.infer<typeof loaPostSchema>;

export type EmployeeAPIResponse = z.infer<typeof employeeAPIResponseSchema>;
export type LoaAPIResponse = z.infer<typeof loaAPIResponseSchema>;
// #endregion
