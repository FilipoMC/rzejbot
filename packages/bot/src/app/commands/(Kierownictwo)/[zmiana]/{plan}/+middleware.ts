import { localMiddleware } from "@/utils/middlewareUtils";
import { rankGroups } from "@shared/config/ranks";
import { MiddlewareContext } from "commandkit";

export function beforeExecute(ctx: MiddlewareContext) {
  localMiddleware(ctx, {
    permissions: {
      allowedRoles: [
        ...rankGroups["Kierownictwo Elektrowni"].id,
        ...rankGroups["Kierownictwo Bloków"].id,
      ],
    },
    devSkipPermsCheck: true,
  });
}
