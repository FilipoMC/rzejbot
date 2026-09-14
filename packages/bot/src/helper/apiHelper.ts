import { ApiHelperReturnType } from "@/types/apiHelper";
import { commandError } from "@/utils/commandResponses";
import {
  EmployeeAPIResponse,
  EmployeePost,
  ShiftAPIResponse,
  ShiftEmployeeLogAPIResponse,
  ShiftLogAbsencePost,
  ShiftLogStationsGetAPIResponse,
  ShiftLogStationsPost,
  ShiftLogStationsPostAPIResponse,
  ShiftPost,
  ShiftReportAPIResponse,
  ShiftReportPatch,
} from "@shared/types/api";
import { getContext, Logger } from "commandkit";
import z from "zod";

/**
 * Creates a URL for the internal API
 * @param route endpoint
 * @param forceRelative make the function throw if the route param starts with /, making it absolute; default = true
 */
export function getRequestURL(
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

export function requestOptions(
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

export async function fetchWithErrorHandling(
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
  employee: {
    create: (
      req: EmployeePost,
    ) => Promise<
      ApiHelperReturnType<EmployeeAPIResponse, z.ZodError<EmployeePost>>
    >;
  };
}

export const ApiHelper = {
  shifts: { report: {}, stations: {} },
  employee: {},
} as ApiHelper;
