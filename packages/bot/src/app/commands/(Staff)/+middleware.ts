import { localMiddleware } from "@/utils/middlewareUtils";
import { MiddlewareContext } from "commandkit";

export function beforeExecute(ctx: MiddlewareContext) {
  localMiddleware(ctx, {});
}
