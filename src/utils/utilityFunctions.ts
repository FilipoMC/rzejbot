import {
  ActivityType,
  Client,
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  PresenceUpdateStatus,
  User,
} from "discord.js";
import { COMMANDKIT_IS_DEV, Logger } from "commandkit";
import kv from "./kv";
import config from "@/config/config.json";

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hasPermissions({
  member,
  allowedRoles,
  allowedPermissions,
}: {
  member: GuildMember;
  allowedRoles?: string[];
  minimumRole?: string;
  allowedPermissions?: PermissionResolvable[];
}) {
  const hasRole =
    allowedRoles?.some((roleId) => member.roles.cache.has(roleId)) ?? false;
  const hasPerms =
    allowedPermissions?.some((permission) =>
      member.permissions.has(permission),
    ) ?? false;

  const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

  return hasRole || hasPerms || hasAdmin;
}

export const delay = (ms: number) => {
  new Promise((resolve) => setTimeout(resolve, ms));
};

export const capitalise = (text: string): string =>
  `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;

/**
 * @param useErrorWithPath [import.meta.filename, module: string, error is supplied by the .catch()]; irrelevant when logError=false
 */
export async function promiseResult<T>(
  promise: Promise<T>,
  errMessage: string | null,
  useErrorWithPath?: [string, string] | null,
  executeOnFail?: (err: string | unknown) => Promise<unknown> | unknown,
  logError: boolean | undefined = true,
): Promise<T | undefined> {
  const result = await promise
    .then((data) => data)
    .catch(async (err) => {
      const errorString = err instanceof Error ? err.message : String(err);
      if (executeOnFail) await executeOnFail(err);
      if (useErrorWithPath && logError) {
        Logger.error(
          "UTILITYFUNCS ERRWITHPATH", // errorWithPath(useErrorWithPath[0], useErrorWithPath[1], err),
        );
      } else if (logError) {
        Logger.error(`${errMessage ? errMessage + "\n" : ""}${errorString}`);
      }
      return undefined;
    });
  return result;
}

export function updateBotPresence(client: Client) {
  if (!client.user) return;
  if (kv.get("devlock")) {
    client.user.setActivity(
      kv.get("devlock-status")?.toString() ?? config.devlock_status,
    );
    client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
    return;
  }
  if (COMMANDKIT_IS_DEV) {
    client.user.setActivity(
      kv.get("dev-status")?.toString() ?? config.dev_status,
    );
    client.user.setStatus(PresenceUpdateStatus.Idle);
  } else {
    client.user.setActivity({
      type: ActivityType.Watching,
      name: kv.get("bot-status")?.toString() ?? config.bot_status,
    });
    client.user.setStatus(PresenceUpdateStatus.Online);
  }
}

export async function logCommandUsage(
  executor: User,
  commandType: "interaction" | "message" | "custom",
  commandName: string,
  customMessage: Record<string, string>,
) {
  const extraValues = [];
  for (const [key, value] of Object.entries(customMessage)) {
    extraValues.push(`**${key}:** ${value}`);
  }

  // const customLogsChnl = await client.channels.fetch(channels.customLogs);
  // if (!customLogsChnl?.isSendable()) return;
  // await customLogsChnl.send({ embeds: [embed] });
}

export function getMessageUrl(
  guildId: string,
  channelId: string,
  messageId: string,
) {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

export function dateUnix(
  operator: "+" | "-" | null,
  modifier: string | null,
  isForDiscord: boolean = true,
  format: "d" | "D" | "t" | "T" | "f" | "F" | "s" | "S" | "R" = "f",
) {
  const msMap: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
    w: 604800000,
  };

  let timeValue = Date.now();

  // 1. Calculate the modification if a modifier is provided (e.g., "7d")
  if (modifier && typeof modifier === "string") {
    const value = parseInt(modifier);
    const unit = modifier.slice(-1).toLowerCase();
    const msToAdd = value * (msMap[unit] || 0);

    if (operator === "+") timeValue += msToAdd;
    else if (operator === "-") timeValue -= msToAdd;
  }

  // 2. Return either Discord Format or raw Epoch
  if (isForDiscord) {
    // Convert ms to seconds for Discord
    const unixSeconds = Math.floor(timeValue / 1000);
    return `<t:${unixSeconds}:${format}>`;
  }

  return timeValue; // Returns raw Epoch ms (useful for DB storage)
}
