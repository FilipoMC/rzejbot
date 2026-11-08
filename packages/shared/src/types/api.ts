import z from "zod";
import {
  employeeAPIResponseSchema,
  employeeChangePostAPIResponseSchema,
  employeeWithChangesAPIResponseSchema,
  loaAPIResponseSchema,
} from "../zod/apiResponses/employee";
import {
  shiftAPIResponseSchema,
  shiftEmployeeLogAPIResponseSchema,
  shiftLogDosePostAPIResponseSchema,
  shiftLogPresenceInitialPostAPIResponseSchema,
  shiftLogPresencePostAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
  shiftReportAPIResponseSchema,
  shiftReportPostAPIResponseSchema,
} from "../zod/apiResponses/shifts";
import {
  employeeChangeTypeSchema,
  employeePatchSchema,
  employeePostSchema,
  employeeRanksSchema,
  employeeWithChangesPostSchema,
  loaPostSchema,
} from "../zod/employeeSchemas";
import {
  shiftLogAbsencePostSchema,
  shiftLogDosesPostSchema,
  shiftLogPresenceInitialPostSchema,
  shiftLogPresencePostSchema,
  shiftLogStationsPostSchema,
  shiftPatchSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "../zod/shiftSchemas";

export type ApiResponse<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// #region shift api types
export type ShiftPost = z.input<typeof shiftPostSchema>;
export type ShiftPatch = z.input<typeof shiftPatchSchema>;

export type ShiftReportPost = z.input<typeof shiftReportPostSchema>;
export type ShiftReportPatch = z.input<typeof shiftReportPatchSchema>;

export type ShiftLogAbsencePost = z.input<typeof shiftLogAbsencePostSchema>;
export type ShiftLogStationsPost = z.input<typeof shiftLogStationsPostSchema>;
export type ShiftLogPresenceInitialPost = z.input<
  typeof shiftLogPresenceInitialPostSchema
>;
export type ShiftLogPresencePost = z.input<typeof shiftLogPresencePostSchema>;
export type ShiftLogDosesPost = z.input<typeof shiftLogDosesPostSchema>;
// #endregion
// #region shift api response types
export type ShiftEmployeeLogAPIResponse = z.output<
  typeof shiftEmployeeLogAPIResponseSchema
>;
export type ShiftAPIResponse = z.output<typeof shiftAPIResponseSchema>;
export type ShiftReportAPIResponse = z.output<
  typeof shiftReportAPIResponseSchema
>;
export type ShiftReportPostAPIResponse = z.output<
  typeof shiftReportPostAPIResponseSchema
>;
export type ShiftLogStationsPostAPIResponse = z.output<
  typeof shiftLogStationsPostAPIResponseSchema
>;
export type ShiftLogStationsGetAPIResponse = z.output<
  typeof shiftLogStationsGetAPIResponseSchema
>;
export type ShiftLogPresenceInitialPostAPIResponse = z.output<
  typeof shiftLogPresenceInitialPostAPIResponseSchema
>;
export type ShiftLogDosesPostAPIResponse = z.output<
  typeof shiftLogDosePostAPIResponseSchema
>;
export type ShiftLogPresencePostAPIResponse = z.output<
  typeof shiftLogPresencePostAPIResponseSchema
>;
// #endregion
// #region employee api types
export type EmployeePost = z.input<typeof employeePostSchema>;
export type EmployeePatch = z.input<typeof employeePatchSchema>;
export type LoaPost = z.input<typeof loaPostSchema>;
export type EmployeeWithChangesPost = z.input<
  typeof employeeWithChangesPostSchema
>;
// #endregion
// #region employee api response types
export type EmployeeAPIResponse = z.output<typeof employeeAPIResponseSchema>;
export type EmployeeWithChangesAPIResponse = z.output<
  typeof employeeWithChangesAPIResponseSchema
>;
export type EmployeeChangePostAPIResponse = z.output<
  typeof employeeChangePostAPIResponseSchema
>;
export type LoaAPIResponse = z.output<typeof loaAPIResponseSchema>;
// #endregion
// #region employee types
/** @description  plus | minus | praise: pochwała | promotion: awans | warn: uwaga | strike: nagana | suspension: zawieszenie | demotion: wypowiedzenie zmieniajace | termination: zwolnienie dysyplinarne */
export type EmployeeChangeType = z.infer<typeof employeeChangeTypeSchema>;
export type EmployeeRanks = z.infer<typeof employeeRanksSchema>;
// #endregion
