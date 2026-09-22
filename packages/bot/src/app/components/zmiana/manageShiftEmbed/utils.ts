import { KitArray } from "@/types/components/zmiana";
import {
  ShiftAPIResponse,
  ShiftLogStationsGetAPIResponse,
  ShiftReportAPIResponse,
} from "@shared/types/api";
import { ButtonKit, ModalKit } from "commandkit";
import { addMinutes } from "date-fns";
import { EmbedBuilder, time, TimestampStyles, userMention } from "discord.js";

function disposeHandlers(handlers: KitArray) {
  for (const handler of handlers) {
    handler.dispose();
  }
}

const buttonHandlers = new Map<number, ButtonKit[]>();
const modalHandlers = new Map<number, ModalKit>();

export function disposeShiftHandlers(shiftId: number) {
  const handlers = buttonHandlers.get(shiftId);
  if (handlers) {
    disposeHandlers(handlers);
  }
  buttonHandlers.delete(shiftId);
}

export function registerButtonHandler(shiftId: number, handler: ButtonKit) {
  const array = buttonHandlers.get(shiftId) ?? [];
  array.push(handler);
  buttonHandlers.set(shiftId, array);
}

export function replaceModalHandler(shiftId: number, handler: ModalKit) {
  const oldHandler = modalHandlers.get(shiftId);
  oldHandler?.dispose();
  modalHandlers.set(shiftId, handler);
}

export function shiftManageEmbedComponentsFilter() {
  return true; // TODO: Replace this with actual filter logic
}

function getTimes(a: string, b: string, c: string) {
  return (
    `Rozpocz. briefingu: ${a}\n` +
    `Rozpoczęcia zmiany: ${b}\n` +
    `Zakończenia zmiany: ${c}\n`
  );
}

export function getShiftManageEmbed(
  shift: ShiftAPIResponse,
  shiftReport?: ShiftReportAPIResponse,
  stations?: ShiftLogStationsGetAPIResponse,
  footer: boolean = true,
) {
  const a =
    shiftReport?.date ?
      time(shiftReport.date, TimestampStyles.ShortTime)
    : "N/A";

  const b =
    shiftReport?.briefingDuration || shiftReport?.briefingDuration === 0 ?
      time(
        addMinutes(shiftReport.date, shiftReport.briefingDuration),
        TimestampStyles.ShortTime,
      )
    : "N/A";

  const c =
    (
      (shiftReport?.briefingDuration || shiftReport?.briefingDuration === 0) &&
      (shiftReport?.duration || shiftReport.duration === 0)
    ) ?
      time(
        addMinutes(
          shiftReport.date,
          shiftReport.briefingDuration + shiftReport.duration,
        ),
        TimestampStyles.ShortTime,
      )
    : "N/A";

  const stationsList =
    stations?.length ?
      stations
        .map(
          ({ station, operators }) =>
            `${station}: *${operators.map(({ employeeNameIC }) => employeeNameIC).join("*, *")}*`,
        )
        .join("\n")
    : "N/A";

  const embed = new EmbedBuilder()
    .setTitle(`Zmiana ${shift.shiftNumber}`)
    .setDescription(
      `**Data zmiany:** ${time(shift.plannedDate, TimestampStyles.ShortDate)}\n` +
        `**Kierownik zmiany:** ${userMention(shift.host.discordId)}\n` +
        (shiftReport?.cohost?.discordId ?
          `**Nadzorujący przełożony:** ${userMention(shiftReport.cohost.discordId)}`
        : ""),
    )
    .setFields([
      {
        name: "Planowany czas",
        value: getTimes(
          time(shift.plannedDate, TimestampStyles.ShortTime),
          time(
            addMinutes(shift.plannedDate, shift.plannedBriefingDuration),
            TimestampStyles.ShortTime,
          ),
          time(
            addMinutes(
              shift.plannedDate,
              shift.plannedBriefingDuration + shift.plannedDuration,
            ),
            TimestampStyles.ShortTime,
          ),
        ),
        inline: true,
      },
      {
        name: "Rzeczywisty czas",
        value: getTimes(a, b, c),
        inline: true,
      },
      { name: "Przydział stanowisk", value: stationsList },
    ]);

  if (footer) {
    embed.setFooter({
      text: "Przyciski poniżej działają tylko dla kierownika zmiany",
    });
  }

  return embed;
}
