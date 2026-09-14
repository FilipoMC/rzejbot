import { apiResponseSchema } from "@shared/zod/apiSchemas";
import {
  ApiHelper,
  fetchWithErrorHandling,
  getRequestURL,
  requestOptions,
} from "./apiHelper";
import { Logger } from "commandkit";
import z from "zod";
import { employeeAPIResponseSchema } from "@shared/zod/apiResponses/employee";
import { employeePostSchema } from "@shared/zod/employeeSchemas";

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

  const bodyParsed = apiResponseSchema(employeeAPIResponseSchema).safeParse(
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
