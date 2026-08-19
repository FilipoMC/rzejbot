/* eslint-disable @typescript-eslint/no-explicit-any */

import { Logger } from "commandkit"

import _ from "lodash";

/**
 * Converts a plain object into a multi-line string:
 * key: value
 * key: value
 */
export function prettyStringifyObject(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(
      ([key, value], idx) =>
        `${idx === 0 && key === "msg" ? "" : `${key}: `}${_.isObject(value) ? JSON.stringify(value) : String(value)}`,
    )
    .join("\n");
}

export interface throwLogger_params {
  msg?: string,
  desc?: string,
  type: "debug" | "error" | "info" | "log" | "warn"
  err?: string | Record<string, any>
}
export function throwLogger({msg, desc, type, err}: throwLogger_params) {
  switch (type) {
    case "debug":
      return Logger.debug({message: msg || null, description: desc || null, error: err || null})
    case "error":
      return Logger.error({message: msg || null, description: desc || null, error: err || null})
    case "info":
      return Logger.info({message: msg || null, description: desc || null, error: err || null})
    case "log":
      return Logger.log({message: msg || null, description: desc || null, error: err || null})
    case "warn":
      return Logger.warn({message: msg || null, description: desc || null, error: err || null})
  }
}
