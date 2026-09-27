type DbActionError = "corrupted";

export type DbActionReturnType<T, TErr = string> =
  | {
      status: "ok";
      data: T;
    }
  | {
      status: "error";
      errorStatus: DbActionError;
      error: TErr;
    };

export type DbActionData<T> =
  T extends { status: "ok"; data: infer D } ? D : never;
