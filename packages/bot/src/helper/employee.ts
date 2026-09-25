import { apiResponseSchema } from "@shared/zod/apiSchemas";
import {
  ApiHelper,
  fetchWithErrorHandling,
  getRequestURL,
  requestOptions,
} from "./apiHelper";
import { Logger } from "commandkit";
import z from "zod";
import {
  employeeAPIGetResponseSchema,
  employeeAPIPostResponseSchema,
  loaAPIResponseSchema,
} from "@shared/zod/apiResponses/employee";
import { employeePostSchema, loaPostSchema } from "@shared/zod/employeeSchemas";
import { snowflakeSchema } from "@shared/zod/discordSchemas";

ApiHelper.employee.find = async (dcId) => {
  const parsedDcId = snowflakeSchema.safeParse(dcId);
  if (!parsedDcId.success) {
    return {
      status: "badArgument",
      error: parsedDcId.error,
    };
  }
  const res = await fetchWithErrorHandling(
    getRequestURL("employees/" + dcId),
    requestOptions("GET"),
  );
  const body = await res.json().catch(() => null);
  const bodyParsed = apiResponseSchema(employeeAPIGetResponseSchema).safeParse(
    body,
  );

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return {
      status: "apiResponseParsingError",
    };
  }

  if (bodyParsed.data.ok) {
    return {
      status: "ok",
      data: bodyParsed.data.data,
    };
  }

  switch (res.status) {
    case 404:
      return {
        status: "apiError",
        errorStatus: "notFound",
        error: "Nie znaleziono pracownika w bazie danych",
      };
    default:
      return {
        status: "apiError",
        errorStatus: "serverError",
        error: "Wystąpił błąd podczas komunikacji serwerem",
      };
  }
};

ApiHelper.employee.create = async (request) => {
  const requestParsed = employeePostSchema.safeParse(request);
  if (!requestParsed.success) {
    Logger.error(z.treeifyError(requestParsed.error));
    return { status: "badArgument", error: requestParsed.error };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL("employees"),
    requestOptions("POST", JSON.stringify(requestParsed.data)),
  );
  const body: unknown = await res.json().catch(() => null);

  const bodyParsed = apiResponseSchema(employeeAPIPostResponseSchema).safeParse(
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
          error: "Pracownik już istnieje.",
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

ApiHelper.employee.loa.create = async (empDiscordId, request) => {
  const reqParsed = loaPostSchema.safeParse(request);
  const employeeId = snowflakeSchema.safeParse(empDiscordId);
  if (!reqParsed.success) {
    Logger.error(z.treeifyError(reqParsed.error));
    return {
      status: "badArgument",
      error: reqParsed.error,
    };
  }

  if (!employeeId.success) {
    Logger.error(z.treeifyError(employeeId.error));
    return {
      status: "badArgument",
      error: employeeId.error,
    };
  }

  const res = await fetchWithErrorHandling(
    getRequestURL(`employees/${employeeId}/loa`),
    requestOptions("POST", JSON.stringify(reqParsed)),
  );

  const body = await res.json().catch(() => null);
  const bodyParsed = apiResponseSchema(loaAPIResponseSchema).safeParse(body);

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

ApiHelper.employee.loa.listForEmployee = async (dId) => {
  const parsedDiD = snowflakeSchema.safeParse(dId);
  if (!parsedDiD.success) {
    Logger.error(z.treeifyError(parsedDiD.error));
    return {
      status: "badArgument",
      error: parsedDiD.error,
    };
  }
  const emplDiscordId = parsedDiD.data;

  const res = await fetchWithErrorHandling(
    getRequestURL(`employees/${emplDiscordId}/loa/list`),
    requestOptions("GET"),
  );

  const body = await res.json().catch(() => null);
  const bodyParsed = apiResponseSchema(loaAPIResponseSchema).safeParse(body);

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
