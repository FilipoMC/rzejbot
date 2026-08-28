import { ApiResponse, ShiftLogAbsencePost, ShiftPost } from "@shared/types/api";
import {
  ShiftAPIResponse,
  ShiftAPIResponseSchema,
  ShiftEmployeeAbsenceAPIResponse,
} from "@shared/types/ApiResponses/shifts";
import {
  shiftLogAbsencePostSchema,
  shiftPostSchema,
} from "@shared/zod/shiftSchemas";
import { Logger } from "commandkit";
import z, { ZodSafeParseResult } from "zod";

function getRequestURL(route: string) {
  const requestBasePath = `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/api/`;
  return `${requestBasePath}${route}`;
}

function requestOptions(
  method: "POST" | "GET" | "PATCH" | "PUT" | "DELETE",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: any = { Authorization: `Bearer ${process.env.API_TOKEN}` },
) {
  return {
    method,
    body,
    headers,
  };
}

interface ApiHelper {
  shifts: {
    /**
     * Creates a shift
     * @param req request body for the POST request
     * @returns
     */
    create: (
      req: ShiftPost,
    ) => Promise<
      ApiResponse<
        ShiftAPIResponse,
        string | ZodSafeParseResult<ShiftAPIResponse>
      >
    >;

    /**
     * Fetches a shift
     * @param shiftId numeric Auto-Incremented shift ID
     */
    getById: (
      id: number,
    ) => Promise<
      ApiResponse<
        ShiftAPIResponse,
        string | ZodSafeParseResult<ShiftAPIResponse>
      >
    >;
    /**
     * Fetches a shift
     * @param shiftNumber The shift number, e.g "006/26"
     * @returns
     */
    getByShiftNumber: (
      shiftNumber: string,
    ) => Promise<
      ApiResponse<
        ShiftAPIResponse,
        string | ZodSafeParseResult<ShiftAPIResponse>
      >
    >;
    logEmployeeAbsence: (
      shiftId: number,
      request: ShiftLogAbsencePost,
    ) => Promise<ApiResponse<ShiftEmployeeAbsenceAPIResponse>>;
  };
  //   employee: {
  //     create: (req: EmployeePost) => Promise<ApiResponse<Omit<EmployeePureType,
  // "shiftsHosted" | "shiftLogs" | "shiftReports">>>
  //   }
}

export const ApiHelper = {
  shifts: {},
} as ApiHelper;

ApiHelper.shifts.create = async (request) => {
  const parsedBody = shiftPostSchema.safeParse(request);
  if (!parsedBody.success) {
    Logger.error(parsedBody.error);
    return { ok: false, error: z.treeifyError(parsedBody.error) };
  }

  const json = await fetch(
    getRequestURL("shifts/"),
    requestOptions(
      "POST",
      typeof request === "string" ? request : JSON.stringify(request),
    ),
  );
  const res = await json.json().catch(() => null);
  return res;
};

ApiHelper.shifts.getById = async (shiftId) => {
  const json = await fetch(
    getRequestURL(`shifts/${shiftId}`),
    requestOptions("GET"),
  );
  const res = await json.json().catch(() => null);

  if (!res.ok) {
    return res;
  }
  const parsed = ShiftAPIResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    Logger.error(parsed);
    return { ok: false, error: parsed };
  }
  return { ok: true, data: parsed.data };
};

ApiHelper.shifts.getByShiftNumber = async (shiftNumber) => {
  const json = await fetch(
    getRequestURL(`shifts?number=${shiftNumber}`),
    requestOptions("GET"),
  );
  const res: ApiResponse<ShiftAPIResponse> = await json
    .json()
    .catch(() => null);
  if (!res.ok) {
    return res;
  }
  const parsed = ShiftAPIResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    Logger.error(parsed);
    return { ok: false, error: parsed };
  }
  return { ok: true, data: parsed.data };
};

ApiHelper.shifts.logEmployeeAbsence = async (shiftId, request) => {
  const parsedBody = shiftLogAbsencePostSchema.safeParse(request);
  if (!parsedBody.success) {
    Logger.error(parsedBody.error);
    return { ok: false, error: z.treeifyError(parsedBody.error) };
  }

  const json = await fetch(
    getRequestURL(`shifts/${shiftId}/logs/absence`),
    requestOptions(
      "POST",
      typeof request === "string" ? request : JSON.stringify(request),
    ),
  );
  const res = await json.json().catch(() => null);
  return res;
};

// ApiHelper.employee.create = async () => {

// }
