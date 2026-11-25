import { localMiddleware } from "@/utils/middlewareUtils";
import { MiddlewareContext } from "commandkit";

export async function beforeExecute(ctx: MiddlewareContext) {
  localMiddleware(ctx, { devonly: true });
}
