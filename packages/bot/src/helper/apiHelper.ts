import { ApiHelperReturnType } from "@/types/apiHelper";
import { commandError } from "@/utils/commandResponses";
import {
  ShiftAPIResponse,
  ShiftEmployeeLogAPIResponse,
  ShiftLogAbsencePost,
  ShiftLogStationsGetAPIResponse,
  ShiftLogStationsPost,
  ShiftLogStationsPostAPIResponse,
  ShiftPost,
  ShiftReportAPIResponse,
  ShiftReportPatch,
  ShiftReportPost,
} from "@shared/types/api";
import {
  shiftAPIResponseSchema,
  shiftEmployeeLogAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
  shiftReportAPIResponseSchema,
} from "@shared/zod/apiResponses/shifts";
import { apiResponseSchema } from "@shared/zod/apiSchemas";
import {
  shiftLogAbsencePostSchema,
  shiftLogStationsPostSchema,
  shiftNumberSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
} from "@shared/zod/shiftSchemas";
import { getContext, Logger } from "commandkit";
import { addMinutes, differenceInMinutes } from "date-fns";
import z from "zod";

/**
 * Creates a URL for the internal API
 * @param route endpoint
 * @param forceRelative make the function throw if the route param starts with /, making it absolute; default = true
 */
function getRequestURL(
  route: string,
  searchParams: Record<string, string> = {},
  forceRelative: boolean = true,
) {
  const requestBasePath = `http://${process.env.SERVER_IP}${process.env.SERVER_PORT ? `:${process.env.SERVER_PORT}` : ""}/api/`;

  if (forceRelative && route.startsWith("/")) {
    throw new Error("Absolute route passed to getRequestURL");
  }

  if (route.includes("?")) {
    throw new Error("Search params passed to getRequestURL in the URL");
  }

  const url = new URL(route, requestBasePath);

  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return url;
}

function requestOptions(
  method: "POST" | "GET" | "PATCH" | "PUT" | "DELETE",
  body?: string,
  headers: HeadersInit = {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
    "Content-Type": "application/json",
  },
): RequestInit {
  return {
    method,
    body,
    headers,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ApiHelperData<T> = T extends { status: "ok"; data: infer D } ? D : never;

export async function apiHelperUnsafe<
  T extends (...args: any[]) => Promise<any>,
>(
  fn: T,
  ...args: Parameters<T>
): Promise<ApiHelperData<Awaited<ReturnType<T>>>> {
  const res = await fn(...args);

  if (res.status !== "ok") {
    throw res;
  }

  return res.data;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchWithErrorHandling(
  ...args: Parameters<typeof fetch>
): Promise<Response> {
  try {
    return await fetch(...args);
  } catch (e) {
    Logger.error(e);

    const context = getContext();

    if (context?.context) {
      const { context: ctx } = context;

      await commandError({
        interactionOrMsg: ctx.isInteraction() ? ctx.interaction : ctx.message,
        description: "Błąd podczas komunikacji z serwerem",
        useFollowUp: true,
      });
    }

    throw e;
  }
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
    ) => Promise<ApiHelperReturnType<ShiftAPIResponse, z.ZodError<ShiftPost>>>;

    /**
     * Fetches a shift
     * @param shiftId numeric Auto-Incremented shift ID
     */
    getById: (id: number) => Promise<ApiHelperReturnType<ShiftAPIResponse>>;
    /**
     * Fetches a shift
     * @param shiftNumber The shift number, e.g "006/26"
     * @returns
     */
    getByShiftNumber: (
      shiftNumber: string,
    ) => Promise<ApiHelperReturnType<ShiftAPIResponse, string>>;

    /**
     * Fetches the current active shift
     * @returns
     */
    getActive: () => Promise<ApiHelperReturnType<ShiftAPIResponse>>;

    logEmployeeAbsence: (
      shiftId: number,
      request: ShiftLogAbsencePost,
    ) => Promise<ApiHelperReturnType<ShiftEmployeeLogAPIResponse, string>>;

    stations: {
      get: (
        shiftId: number,
      ) => Promise<ApiHelperReturnType<ShiftLogStationsGetAPIResponse>>;
      log: (
        shiftId: number,
        request: ShiftLogStationsPost,
      ) => Promise<ApiHelperReturnType<ShiftLogStationsPostAPIResponse>>;
    };

    report: {
      get: (
        shiftId: number,
      ) => Promise<ApiHelperReturnType<ShiftReportAPIResponse>>;
      update: (
        shiftId: number,
        request: ShiftReportPatch,
      ) => Promise<ApiHelperReturnType<ShiftReportAPIResponse>>;
      markBriefingStart: (
        shiftId: number,
        date?: Date,
      ) => Promise<ApiHelperReturnType<ShiftReportAPIResponse>>;
      mark: (
        event: "shiftStart" | "shiftEnd",
        shiftId: number,
        date?: Date,
      ) => Promise<ApiHelperReturnType<ShiftReportAPIResponse>>;
    };
  };
  //   employee: {
  //     create: (req: EmployeePost) => Promise<ApiResponse<Omit<EmployeePureType,
  // "shiftsHosted" | "shiftLogs" | "shiftReports">>>
  //   }
}

export const ApiHelper = {
  shifts: { report: {}, stations: {} },
} as ApiHelper;

ApiHelper.shifts.create = async (request) => {
  const requestParsed = shiftPostSchema.safeParse(request);
  if (!requestParsed.success) {
    Logger.error(z.treeifyError(requestParsed.error));
    return { status: "badArgument", error: requestParsed.error };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL("shifts"),
    requestOptions("POST", JSON.stringify(requestParsed.data)),
  );
  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftAPIResponseSchema).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
  } else {
    switch (res.status) {
      case 409:
        return {
          status: "apiError",
          errorStatus: "conflict",
          error: "Zmiana z tym numerem już istnieje.",
        };
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Nie znaleziono pracownika pod tym ID konta na discordzie",
        };
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.getById = async (shiftId) => {
  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}`),
    requestOptions("GET"),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftAPIResponseSchema).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana o podanym ID nie istnieje",
        };

      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.getByShiftNumber = async (shiftNumber) => {
  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    return {
      status: "badArgument",
      error: "Format numeru zmiany jest nieprawidłowy",
    };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts`, { number: shiftNumberParsed.data }),
    requestOptions("GET"),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftAPIResponseSchema).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana o podanym numerze nie istnieje",
        };

      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.getActive = async () => {
  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/active`),
    requestOptions("GET"),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftAPIResponseSchema).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Nie ma aktualnie żadnej aktywniej zmiany",
        };

      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.logEmployeeAbsence = async (shiftId, request) => {
  const requestParsed = shiftLogAbsencePostSchema.safeParse(request);
  if (!requestParsed.success) {
    Logger.error(z.treeifyError(requestParsed.error));
    return {
      status: "badArgument",
      error: "Niepoprawne ID konta na discordzie",
    };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/logs/absence`),
    requestOptions("POST", JSON.stringify(requestParsed.data)),
  );
  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(
    shiftEmployeeLogAPIResponseSchema,
  ).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
  } else {
    switch (res.status) {
      case 409:
        return {
          status: "apiError",
          errorStatus: "conflict",
          error: "Istnieje już wpis o tym pracowniku do rejestru tej zmiany",
        };
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana lub pracownik nie istnieje",
        };
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.report.get = async (shiftId) => {
  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/report`),
    requestOptions("GET"),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftReportAPIResponseSchema).safeParse(
    body,
  );

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Raport do podanej zmiany nie istnieje",
        };

      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.report.update = async (shiftId, request) => {
  const requestParsed = shiftReportPatchSchema.safeParse(request);
  if (!requestParsed.success) {
    Logger.error(z.treeifyError(requestParsed.error));
    return { status: "badArgument" };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/report`),
    requestOptions("PATCH", JSON.stringify(requestParsed.data)),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftReportAPIResponseSchema).safeParse(
    body,
  );

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana lub pracownik nie istnieje",
        };
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.report.markBriefingStart = async (shiftId, date) => {
  date ??= new Date();

  const request: ShiftReportPost = {
    date,
  };

  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/report`),
    requestOptions("POST", JSON.stringify(request)),
  );
  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(shiftReportAPIResponseSchema).safeParse(
    body,
  );

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
  } else {
    switch (res.status) {
      case 409:
        return {
          status: "apiError",
          errorStatus: "conflict",
          error: "Istnieje już raport do tej zmiany",
        };
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana nie istnieje",
        };
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.report.mark = async (event, shiftId, date) => {
  date ??= new Date();

  const shiftReport = await ApiHelper.shifts.report.get(shiftId);

  if (shiftReport.status !== "ok") {
    return shiftReport;
  }

  let body: ShiftReportPatch;

  switch (event) {
    case "shiftStart":
      body = {
        briefingDuration: differenceInMinutes(date, shiftReport.data.date),
      };
      break;

    case "shiftEnd":
      if (shiftReport.data.briefingDuration === null) {
        return {
          status: "otherError",
          errorStatus: "invalidData",
          error: "Nie został oznaczony czas rozpoczęcia zmiany w tym raporcie",
        };
      }

      body = {
        duration: differenceInMinutes(
          date,
          addMinutes(shiftReport.data.date, shiftReport.data.briefingDuration),
        ),
      };
      break;
  }

  return await ApiHelper.shifts.report.update(shiftId, body);
};

ApiHelper.shifts.stations.get = async (shiftId) => {
  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/logs/stations`),
    requestOptions("GET"),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(
    shiftLogStationsGetAPIResponseSchema,
  ).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  } else {
    switch (res.status) {
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

ApiHelper.shifts.stations.log = async (shiftId, request) => {
  const requestParsed = shiftLogStationsPostSchema.safeParse(request);

  if (!requestParsed.success) {
    Logger.error(z.treeifyError(requestParsed.error));
    return { status: "badArgument" };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL(`shifts/${shiftId}/logs/stations`),
    requestOptions("POST", JSON.stringify(requestParsed.data)),
  );

  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(
    shiftLogStationsPostAPIResponseSchema,
  ).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
  } else {
    switch (res.status) {
      case 404:
        return {
          status: "apiError",
          errorStatus: "notFound",
          error: "Zmiana nie istnieje",
        };
      default:
        Logger.error(bodyParsed.data.error);
        return {
          status: "apiError",
          errorStatus: "serverError",
          error: "Wystąpił błąd podczas komunikacji z serwerem.",
        };
    }
  }
};

// ApiHelper.employee.create = async () => {

// }
