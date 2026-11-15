export type ApiResponseError =
  | "conflict"
  | "notFound"
  | "badRequest"
  | "serverError";

export type ApiHelperReturnType<
  T,
  TArgError = undefined,
  TApiErr = string,
  TOtherErr = string,
> =
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
      error?: TArgError;
    }
  | {
      status: "apiResponseParsingError";
      error?: undefined;
    }
  | {
      status: "otherError";
      errorStatus: "invalidData";
      error: TOtherErr;
    };

export type ApiHelperData<T> =
  T extends { status: "ok"; data: infer D } ? D : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiHelperReturnData<T extends (...args: any[]) => Promise<any>> =
  ApiHelperData<Awaited<ReturnType<T>>>;
