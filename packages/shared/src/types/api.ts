import z from "zod";
import {
  shiftLogAbsencePostSchema,
  shiftLogDosesPostSchema,
  shiftLogStationsPostSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "../zod/shiftSchemas";
import {
  employeePostSchema,
  employeePatchSchema,
  loaPostSchema,
  employeeWithChangesPostSchema,
  employeeChangeTypeSchema,
  employeeRanksSchema,
} from "../zod/employeeSchemas";
import {
  shiftEmployeeLogAPIResponseSchema,
  shiftAPIResponseSchema,
  shiftReportAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
  shiftLogDosePostAPIResponseSchema,
  shiftReportPostAPIResponseSchema,
} from "../zod/apiResponses/shifts";
import { Prettify } from "./utils";
import {
  employeeAPIResponseSchema,
  employeeChangePostAPIResponseSchema,
  employeeWithChangesAPIResponseSchema,
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
export type ShiftLogDosesPost = Prettify<
  Omit<z.infer<typeof shiftLogDosesPostSchema>[number], "employee"> & {
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
export type ShiftReportPostAPIResponse = z.infer<
  typeof shiftReportPostAPIResponseSchema
>;
export type ShiftLogStationsPostAPIResponse = z.infer<
  typeof shiftLogStationsPostAPIResponseSchema
>;
export type ShiftLogStationsGetAPIResponse = z.infer<
  typeof shiftLogStationsGetAPIResponseSchema
>;
export type ShiftLogDosesPostAPIResponse = z.infer<
  typeof shiftLogDosePostAPIResponseSchema
>;
// #endregion
// #region employee types
export type EmployeePost = z.infer<typeof employeePostSchema>;
export type EmployeePatch = z.infer<typeof employeePatchSchema>;
export type LoaPost = z.infer<typeof loaPostSchema>;
export type EmployeeWithChangesPost = z.infer<
  typeof employeeWithChangesPostSchema
>;

export type EmployeeAPIResponse = z.infer<typeof employeeAPIResponseSchema>;
export type EmployeeWithChangesAPIResponse = z.infer<
  typeof employeeWithChangesAPIResponseSchema
>;
export type EmployeeChangePostAPIResponse = z.infer<
  typeof employeeChangePostAPIResponseSchema
>;
export type LoaAPIResponse = z.infer<typeof loaAPIResponseSchema>;

/** @description  plus | minus | praise: pochwała | promotion: awans | warn: uwaga | strike: nagana | suspension: zawieszenie | demotion: wypowiedzenie zmieniajace | termination: zwolnienie dysyplinarne */
export type EmployeeChangeType = z.infer<typeof employeeChangeTypeSchema>;
export type EmployeeRanks = z.infer<typeof employeeRanksSchema>;
// #endregion
