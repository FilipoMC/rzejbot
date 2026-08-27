import { hasPermissions } from "@/utils/utilityFunctions";
import {
  AutocompleteCommandContext,
  ChatInputCommandContext,
  CommandMetadata,
} from "commandkit";
import { UnwrapTuple, Prettify } from "./utils";

export interface CustomCommandMetadata extends CommandMetadata {
  devonly?: boolean;
  permissions?: Prettify<
    Omit<UnwrapTuple<Parameters<typeof hasPermissions>>, "member">
  >;
  botPermissions?: never;
  userPermissions?: never;
}

export type SubcommandHandler<T = void> = (
  ctx: ChatInputCommandContext,
) => Promise<T>;

export type SubcommandMap<T = void> = Record<string, SubcommandHandler<T>>;
export type GroupMap<T = void> = Record<string, SubcommandMap<T>>;

export type AutocompleteHandler<T = void> = (
  ctx: AutocompleteCommandContext,
) => Promise<T>;

export type AutocompleteMap<T = void> = Record<string, AutocompleteHandler<T>>;
export type AutocompleteGroupMap<T = void> = Record<string, AutocompleteMap<T>>;
