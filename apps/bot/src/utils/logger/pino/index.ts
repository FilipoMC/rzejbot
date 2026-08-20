import pino from "pino";
import fs from "fs";
import { COMMANDKIT_IS_DEV, getContext, Logger } from "commandkit";

const fileName = COMMANDKIT_IS_DEV ? "dev" : "app";
const logFolder = "logs";
const filePath = `${logFolder}/${fileName}.log`;

const logLevel: pino.LevelWithSilent = COMMANDKIT_IS_DEV ? "trace" : "info";

let destination = pino.destination({
  dest: filePath,
  sync: false,
});

const customLevels = {
  logFileArchive: 35,
};

export let FileLogger = pino({ level: logLevel, customLevels }, destination);

/**
 * Rotate the log file
 * @param log Should logs be written at the end of archived file and the beginning of the new file; default is true
 * @param manual Should the action be logged as manual, tries to include the author using commandkit's context; irrelevant if log = false
 *
 * @returns filename of the archived log
 */
export function rotateFileLog(
  log: boolean | undefined = true,
  manual?: boolean,
) {
  if (log) logLogRotation("END", manual);
  destination.end();

  const ts = new Date().toISOString().replaceAll(":", "-");
  const name = `${fileName}-${ts}.log`;
  fs.renameSync(filePath, `${logFolder}/${name}`);

  destination = pino.destination({ dest: filePath, sync: false });
  FileLogger = pino({ level: logLevel, customLevels }, destination);

  if (log) logLogRotation("BEGIN", manual, name);

  return name;
}

function logLogRotation(
  type: "BEGIN" | "END",
  manual?: boolean,
  oldFileName?: string,
) {
  const env = getContext();
  const author =
    manual && env?.context ?
      env.context.isMessage() ?
        env.context.message.author
      : env.context.interaction.user
    : undefined;

  const content = {
    msg: `---- ${type} OF LOG FILE ----`,
    manual: manual ?? false,
    type,
    ...(type === "BEGIN" ? { oldFile: oldFileName } : {}),
    ...(author ? { actionBy: author.id } : {}),
  };
  FileLogger.logFileArchive(content);

  if (manual && type === "BEGIN") {
    Logger.info({
      msg: "Log file manually rotated",
      oldFile: oldFileName,
      actionBy: author?.username ?? "Couldn't get from context",
    });
  }
}
