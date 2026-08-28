export type ApiResponseError =
  | "conflict"
  | "notFound"
  | "badRequest"
  | "serverError";

export type ApiHelperReturnType<T, TArgError = never, TApiErr = string> =
  | {
      status: "ok";
      data: T;
    }
  | {
      status: "apiError";
      errorStatus: ApiResponseError;
      error: TApiErr;
    }
  | {
      status: "badArgument";
      error: TArgError;
    }
  | {
      status: "apiResponseParsingError";
    };
