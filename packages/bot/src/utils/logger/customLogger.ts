/* eslint-disable @typescript-eslint/no-explicit-any */

import { COMMANDKIT_IS_DEV, DefaultLogger, ILogger } from "commandkit";
import { FileLogger } from "./pino";
import _ from "lodash";
import { prettyStringifyObject } from "./loggingUtils";

export class CustomLogger extends DefaultLogger implements ILogger {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  debug(message: any): void;
  debug(strings: TemplateStringsArray, ...values: any[]): void;
  debug(messageOrStrings: any | TemplateStringsArray, ...values: any[]): void {
    FileLogger.debug(messageOrStrings, ...values);

    // Don't print DEBUG level in prod
    if (!COMMANDKIT_IS_DEV) {
      return;
    }

    if (_.isPlainObject(messageOrStrings)) {
      super.debug(prettyStringifyObject(messageOrStrings));
      return;
    }

    super.debug(messageOrStrings, ...values);
  }

  /**
   * Logs an error message.
   * @param message The error message to log.
   */
  error(message: any): void;
  error(strings: TemplateStringsArray, ...values: any[]): void;
  error(messageOrStrings: any | TemplateStringsArray, ...values: any[]): void {
    FileLogger.error(messageOrStrings, ...values);

    if (_.isPlainObject(messageOrStrings)) {
      super.error(prettyStringifyObject(messageOrStrings));
      return;
    }

    super.error(messageOrStrings, ...values);
  }

  /**
   * Logs a default message.
   * @param message The message to log.
   */
  log(message: any): void;
  log(strings: TemplateStringsArray, ...values: any[]): void;
  log(messageOrStrings: any | TemplateStringsArray, ...values: any[]): void {
    FileLogger.info(messageOrStrings, ...values);

    if (_.isPlainObject(messageOrStrings)) {
      super.log(prettyStringifyObject(messageOrStrings));
      return;
    }

    super.log(messageOrStrings, ...values);
  }

  /**
   * Logs an info message.
   * @param message The informational message to log.
   */
  info(message: any): void;
  info(strings: TemplateStringsArray, ...values: any[]): void;
  info(messageOrStrings: any | TemplateStringsArray, ...values: any[]): void {
    if (
      !COMMANDKIT_IS_DEV &&
      typeof messageOrStrings === "string" &&
      messageOrStrings.includes("Command executed successfully")
    ) {
      return;
    }

    if (_.isPlainObject(messageOrStrings)) {
      super.info(prettyStringifyObject(messageOrStrings));
      return;
    }

    super.info(messageOrStrings, ...values);
  }

  /**
   * Logs a warning message.
   * @param message The warning message to log.
   */
  warn(message: any): void;
  warn(strings: TemplateStringsArray, ...values: any[]): void;
  warn(messageOrStrings: any | TemplateStringsArray, ...values: any[]): void {
    FileLogger.warn(messageOrStrings, ...values);

    if (_.isPlainObject(messageOrStrings)) {
      super.warn(prettyStringifyObject(messageOrStrings));
      return;
    }

    super.warn(messageOrStrings, ...values);
  }
}
