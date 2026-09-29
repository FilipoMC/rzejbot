import { apiResponseSchema } from "@shared/zod/apiSchemas";
import {
  ApiHelper,
  fetchWithErrorHandling,
  getRequestURL,
  requestOptions,
} from "./apiHelper";
import z from "zod";
import { Logger } from "commandkit";

ApiHelper.dev.revalidateCaches = async () => {
  const res = await fetchWithErrorHandling(
    getRequestURL("dev/revalidateCaches"),
    requestOptions("POST"),
  );
  const body: unknown = await res.json().catch(() => false); // null is the correct response; using false instead

  const bodyParsed = apiResponseSchema(z.null()).safeParse(body);

  if (!bodyParsed.success) {
    Logger.error(z.treeifyError(bodyParsed.error));
    return { status: "apiResponseParsingError" };
  }

  if (bodyParsed.data.ok) {
    return { status: "ok", data: bodyParsed.data.data };
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
