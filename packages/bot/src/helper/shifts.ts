import { apiResponseSchema } from "@shared/zod/apiSchemas";
import {
  ApiHelper,
  fetchWithErrorHandling,
  getRequestURL,
  requestOptions,
} from "./apiHelper";
import {
  shiftAPIResponseSchema,
  shiftEmployeeLogAPIResponseSchema,
  shiftLogStationsGetAPIResponseSchema,
  shiftLogStationsPostAPIResponseSchema,
  shiftReportAPIResponseSchema,
} from "@shared/zod/apiResponses/shifts";
import {
  shiftLogAbsencePostSchema,
  shiftLogStationsPostSchema,
  shiftNumberSchema,
  shiftPostSchema,
  shiftReportPatchSchema,
} from "@shared/zod/shiftSchemas";
import z from "zod";
import { Logger } from "commandkit";
import { ShiftReportPatch, ShiftReportPost } from "@shared/types/api";
import { addMinutes, differenceInMinutes } from "date-fns";

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
