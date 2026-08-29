import { hasPermissions } from "@/utils/utilityFunctions";
import { CommandMetadata } from "commandkit";
import { UnwrapTuple, Prettify } from "./utils";

export interface CustomCommandMetadata extends CommandMetadata {
  devonly?: boolean;
  permissions?: Prettify<
    Omit<UnwrapTuple<Parameters<typeof hasPermissions>>, "member">
  >;
  botPermissions?: never;
  userPermissions?: never;
}
