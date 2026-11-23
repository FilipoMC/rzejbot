import client from "@/app";
import prepareShiftBriefing, {
  PrepareShiftBriefingTaskData,
} from "@/app/tasks/prepareShiftBriefing";
import channels from "@/config/channels";
import other, { kvKeys } from "@/config/other";
import { getRandomImage, shiftEventName, websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import { CustomCommandMetadata } from "@/types/commands";
import {
  commandError,
  commandSuccess,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import kv from "@/utils/kv";
import { fetchChannelResolvable } from "@/utils/utilityFunctions";
import { createTask } from "@commandkit/tasks";
import { defaultShiftShortDesc } from "@shared/config/defaults";
import { mainRanks } from "@shared/config/ranks";
import { Button, ButtonKit, ChatInputCommand, CommandData } from "commandkit";
import {
  addMinutes,
  differenceInMilliseconds,
  minutesToMilliseconds,
} from "date-fns";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  hyperlink,
  userMention,
} from "discord.js";
import z from "zod";

export const eventHandledAbsenceButton = {
  customId: {
    prefix: "absence",
    make(shiftId: number) {
      return `${this.prefix}_${shiftId}`;
    },
    get validator() {
      return z.tuple(
        [z.literal(this.prefix), z.coerce.number()],
        "bad customId for absence button",
      );
    },
  },
};

export const command: CommandData = {
  name: "zatwierdz",
  description: "Zatwierdź plan zmiany.",
  options: [
    {
      name: "zmiana",
      description: "Numer zmiany w formacie XXX/YY",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "event",
      description: "Opis eventu",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "zatwierdzony",
      description: "Czy zmiana ma być zatwierdzona czy nie (domyślnie: true)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: "silent",
      description:
        "Czy mają zostać wysłane odpowiednie wiadomości (domyślnie: false)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Pobieranie zmiany...",
  });
  const shiftNumber = interaction.options.getString("zmiana", true);
  const approved = interaction.options.getBoolean("zatwierdzony") ?? true;
  const silent = interaction.options.getBoolean("silent") ?? false;

  const shiftRes = await ApiHelper.shifts.getByShiftNumber(shiftNumber);

  if (shiftRes.status === "badArgument") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: shiftRes.error ?? "",
    });
    return;
  } else if (
    shiftRes.status === "apiError" &&
    shiftRes.errorStatus === "notFound"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Podana zmiana nie istnieje.",
    });
    return;
  } else if (shiftRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas komunikacji z serwerem.",
    });
    return;
  }

  const shift = shiftRes.data;

  await loading({
    interactionOrMsg: interaction,
    description: "Aktualizowanie stanu zmiany...",
  });

  const reportRes = await ApiHelper.shifts.changeApproval(shift.id, {
    approved,
  });

  if (reportRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas aktualizowania stanu zmiany.",
    });
    return;
  }

  if (!approved || silent) {
    await commandSuccess({
      interactionOrMsg: interaction,
      description: undefined,
    });
    return;
  }

  if (!interaction.inCachedGuild()) {
    return;
  }

  const eventDesc =
    interaction.options.getString("event") ??
    kv.get(kvKeys.other.shiftPlanEventDescription(shift.shiftNumber)) ??
    defaultShiftShortDesc;

  if (!eventDesc) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description:
        "Nie ma zapisanego żadnego opisu eventu do tej zmiany, potrzebny jest argument",
    });
    return;
  }

  await Promise.all([
    (async () => {
      const event = await interaction.guild.scheduledEvents
        .create({
          name: shiftEventName(shift.shiftNumber),
          scheduledStartTime: shift.plannedDate,
          scheduledEndTime: addMinutes(
            shift.plannedDate,
            shift.plannedBriefingDuration + shift.plannedDuration,
          ),
          entityType: GuildScheduledEventEntityType.Voice,
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          channel: channels.zmianaVC.main,
          description: eventDesc,
          image: getRandomImage("shiftEvent"),
        })
        .catch(() => null);

      const createActionRow = (disabled: boolean = false) =>
        new ActionRowBuilder<ButtonKit>().setComponents(
          <Button
            customId={eventHandledAbsenceButton.customId.make(shift.id)}
            style={ButtonStyle.Danger}
            disabled={disabled}
          >
            Zgłoś nieobecność
          </Button>,
        );

      const ogloszeniaBlokow = await fetchChannelResolvable(
        channels.ogloszeniaBlokow,
        client,
      );

      if (ogloszeniaBlokow?.isSendable()) {
        let content;
        if (event) {
          content = hyperlink(`Zmiana ${shift.shiftNumber}`, event.url);
        } else {
          content = hyperlink(
            `Zmiana ${shift.shiftNumber}`,
            websitePages.shiftPlan(shift.shiftNumber),
          );
        }
        const message = await ogloszeniaBlokow.send({
          content,
          components: [createActionRow()],
        });

        setTimeout(
          () => {
            message.edit({ components: [createActionRow(true)] });
          },
          differenceInMilliseconds(shift.plannedDate, new Date()) -
            minutesToMilliseconds(other.shifts.absenceAllowedUntil),
        );
      }
    })(),
    (async () => {
      const plansChannel = await fetchChannelResolvable(channels.plany, client);

      if (plansChannel?.isSendable()) {
        await plansChannel.send({
          content: websitePages.shiftPlan(shift.shiftNumber),
        });
      }
    })(),
    (async () => {
      const channel = await fetchChannelResolvable(
        channels.kierownicy_zmian,
        client,
      );

      if (channel?.isSendable()) {
        await channel.send({
          content: `**${shift.shiftNumber}** - zaakceptowano ${hyperlink("plan zmiany", websitePages.shiftPlan(shift.shiftNumber))}\nKierownik: ${userMention(shift.host.discordId)}`,
        });
      }
    })(),
  ]);

  createTask({
    name: prepareShiftBriefing.name,
    data: {
      shiftIdentifier: { number: shift.shiftNumber },
      guildId: interaction.guildId,
    } satisfies PrepareShiftBriefingTaskData,
    schedule: shift.plannedDate,
  });

  kv.delete(kvKeys.other.shiftPlanEventDescription(shift.shiftNumber));

  await commandSuccess({
    interactionOrMsg: interaction,
    description: undefined,
  });
};

export const metadata: CustomCommandMetadata = {
  skipLocalMiddleware: true,
  permissions: {
    allowedRoles: [mainRanks["Główny Inżynier Elektrowni"]],
  },
};
