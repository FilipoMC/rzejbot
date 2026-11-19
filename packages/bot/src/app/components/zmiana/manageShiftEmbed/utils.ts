import config from "@/config/config";
import { websitePages } from "@/config/script";
import { CommandkitBullshitHandler } from "@/utils/classes/bullshitHandler";
import {
  ShiftAPIResponse,
  ShiftLogStationsGetAPIResponse,
  ShiftReportAPIResponse,
} from "@shared/types/api";
import { ButtonKit, ModalKit } from "commandkit";
import { addMinutes } from "date-fns";
import {
  EmbedBuilder,
  hyperlink,
  Interaction,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";

const buttonBSHandler = new CommandkitBullshitHandler<ButtonKit, number>();
const modalBSHandler = new CommandkitBullshitHandler<ModalKit, number>();

export function disposeShiftHandlers(shiftId: number) {
  buttonBSHandler.disposeCollector(shiftId);
}

export function registerButtonHandler(shiftId: number, handler: ButtonKit) {
  buttonBSHandler.addCollector(shiftId, handler);
}

export function replaceModalHandler(shiftId: number, handler: ModalKit) {
  modalBSHandler.replaceOldCollector(shiftId, handler);
}

export function removeModalHandler(shiftId: number) {
  modalBSHandler.disposeCollector(shiftId);
}

export function createShiftManageEmbedComponentsFilter(hostId: string) {
  return (interaction: Interaction) => {
    if (config.devs.includes(interaction.user.id)) {
      return true;
    }

    return hostId === interaction.user.id;
  };
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
  shiftReportLink: boolean = true,
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
        : "") +
        (shiftReportLink ?
          hyperlink(
            "*Link do raportu zmiany*",
            websitePages.shiftReport(shift.shiftNumber),
          )
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
