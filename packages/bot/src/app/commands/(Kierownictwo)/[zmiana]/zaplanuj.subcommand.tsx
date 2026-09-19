import prepareShiftBriefing, {
  PrepareShiftBriefingTaskData,
} from "@/app/tasks/prepareShiftBriefing";
import channels from "@/config/channels.json";
import other from "@/config/other.json";
import { getRandomImage, shiftEventName, websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import { failedToExecute, loading, success } from "@/utils/commandResponses";
import { createFailEmbed } from "@/utils/embeds";
import {
  fetchChannelResolvable,
  safeParseWithReply,
} from "@/utils/utilityFunctions";
import { createTask } from "@commandkit/tasks";
import sharedConfig from "@shared/config/config.json";
import {
  defaultShiftGoal,
  defaultShiftNotes,
  defaultShiftShortDesc,
} from "@shared/config/defaults";
import { anyDateStringSchema } from "@shared/zod/dateTimeSchemas";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import {
  AutocompleteCommand,
  ChatInputCommand,
  CommandData,
  Label,
  Modal,
  OnModalKitSubmit,
  RadioGroup,
  RadioGroupOption,
  TextInput,
  UserSelectMenu,
} from "commandkit";
import { addDays, addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { formatDate } from "date-fns/format";
import {
  ApplicationCommandOptionChoiceData,
  ApplicationCommandOptionType,
  codeBlock,
  EmbedBuilder,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  hyperlink,
  MessageFlags,
  TextInputStyle,
} from "discord.js";

export const command: CommandData = {
  name: "zaplanuj",
  description: "Zaplanuj zmianę",
  options: [
    {
      name: "numer",
      description: "Numer zmiany w formacie XXX/YY",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "kiedy",
      description: "Kiedy jest zmiana, w formacie DD/MM/YYYY HH:MM",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
    {
      name: "briefing",
      description: `Długość briefingu, domyślnie ${other.shifts.defaultBriefingDuration}`,
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "zmiana",
      description: `Długość zmiany, domyślnie ${other.shifts.defaultShiftDuration}`,
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  const shiftNumberUnparsed = interaction.options.getString("numer", true);
  const dateUnparsed = interaction.options.getString("kiedy", true);
  const briefingDuration =
    interaction.options.getNumber("briefing") ??
    other.shifts.defaultBriefingDuration;
  const shiftDuration =
    interaction.options.getNumber("zmiana") ??
    other.shifts.defaultShiftDuration;

  const shiftNumber = await safeParseWithReply(
    shiftNumberUnparsed,
    shiftNumberSchema,
    interaction,
  );
  if (!shiftNumber) {
    return;
  }

  const dateParsed = await safeParseWithReply(
    dateUnparsed,
    anyDateStringSchema,
    interaction,
    "Format daty zmiany jest nieprawidłowy.",
  );
  if (!dateParsed) {
    return;
  }

  const date = addMinutes(dateParsed, -briefingDuration);

  if (date.getTime() <= new Date().getTime()) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Zmiana nie może być zaplanowana w przeszłości",
    });
    return;
  }

  const modalHandler: OnModalKitSubmit = async (modalInteraction, ctx) => {
    if (!modalInteraction.inCachedGuild()) {
      ctx.dispose();
      return;
    }

    const shiftHost = modalInteraction.fields
      .getSelectedUsers("shiftHost", true)
      .at(0)!;
    const unitUnparsed = modalInteraction.fields.getRadioGroup("unit", true);
    const eventDesc = modalInteraction.fields.getTextInputValue("eventDesc");
    const shiftGoal = modalInteraction.fields.getTextInputValue("shiftGoal");
    const notes = modalInteraction.fields.getTextInputValue("notes");

    const unit =
      unitUnparsed === "1" ? "I"
      : unitUnparsed === "2" ? "II"
      : "I/II";

    await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });
    await loading({
      interactionOrMsg: modalInteraction,
      description: undefined,
    });

    const res = await ApiHelper.shifts.create({
      shiftNumber,
      unit,
      host: shiftHost.id,
      shortDesc: eventDesc,
      shiftGoal,
      notes,
      plannedDate: date,
      plannedDuration: shiftDuration,
      plannedBriefingDuration: briefingDuration,
    });

    if (res.status !== "ok") {
      let embed: EmbedBuilder | null = null;

      if (res.status === "apiError") {
        if (res.errorStatus === "notFound") {
          embed = createFailEmbed(
            "Podany kierownik zmiany nie jest w rejestrze pracowników.",
          );
        } else if (res.errorStatus === "conflict") {
          embed = createFailEmbed("Zmiana z tym numerem już istnieje");
        }
      }

      if (!embed) {
        embed = createFailEmbed(
          "Wystąpił błąd podczas komunikacji z serwerem.",
        );
      }

      embed.setDescription(
        embed.data.description + "\n\nWprowadzone dane znajdują się poniżej",
      );

      await interaction.followUp({
        embeds: [
          embed,
          new EmbedBuilder().setDescription(codeBlock(eventDesc)),
          new EmbedBuilder().setDescription(codeBlock(shiftGoal)),
          new EmbedBuilder().setDescription(codeBlock(notes)),
        ],
      });

      ctx.dispose();
      return;
    }

    await Promise.all([
      (async () => {
        const event = await modalInteraction.guild.scheduledEvents
          .create({
            name: shiftEventName(shiftNumber),
            scheduledStartTime: date,
            scheduledEndTime: addMinutes(
              date,
              other.shifts.defaultBriefingDuration +
                other.shifts.defaultShiftDuration,
            ),
            entityType: GuildScheduledEventEntityType.Voice,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            channel: channels.zmianaVC.main,
            description: eventDesc,
            image: getRandomImage("shiftEvent"),
          })
          .catch(() => null);

        if (event) {
          const ogloszeniaBlokow = await fetchChannelResolvable(
            channels.ogloszeniaBlokow,
            modalInteraction.client,
          );
          if (ogloszeniaBlokow?.isSendable()) {
            ogloszeniaBlokow.send(
              hyperlink(`Zmiana ${shiftNumber}`, event.url),
            );
          }
        }
      })(),
      (async () => {
        const plansChannel = await fetchChannelResolvable(
          channels.plany,
          modalInteraction.client,
        );
        if (plansChannel?.isSendable()) {
          plansChannel.send(websitePages.shiftPlan(shiftNumber));
        }
      })(),
    ]);

    createTask({
      name: prepareShiftBriefing.name,
      data: {
        shiftIdentifier: { number: shiftNumber },
        guildId: modalInteraction.guildId,
      } satisfies PrepareShiftBriefingTaskData,
      schedule: date,
    });

    await success({
      interactionOrMsg: modalInteraction,
      description: `Pomyślnie utworzono plan zmiany ${shiftNumber}. ${hyperlink("Link do planu zmiany", websitePages.shiftPlan(shiftNumber))}`,
    });

    ctx.dispose();
  };

  const modal = (
    <Modal
      title="Zaplanuj zmianę"
      onSubmit={modalHandler}
      customId={`createShift_${interaction.user.id}`}
    >
      <Label label="Kierownik zmiany">
        <UserSelectMenu
          customId="shiftHost"
          defaultValues={interaction.user.id}
          minValues={1}
          maxValues={1}
          required
        />
      </Label>
      <Label label="Unit, na którym zmiana będzie miała miejsce">
        <RadioGroup customId="unit" required>
          <RadioGroupOption label="Unit I" value="1" />
          <RadioGroupOption label="Unit II" value="2" />
          <RadioGroupOption label="Unit I/II" value="3" />
        </RadioGroup>
      </Label>
      <Label label="Opis event'u na discordzie">
        <TextInput
          customId="eventDesc"
          style={TextInputStyle.Paragraph}
          value={defaultShiftShortDesc}
          required
        />
      </Label>
      <Label label="Cel Zmiany">
        <TextInput
          customId="shiftGoal"
          style={TextInputStyle.Paragraph}
          value={defaultShiftGoal}
          required
        />
      </Label>
      <Label label="Instrukcje i Uwagi">
        <TextInput
          customId="notes"
          style={TextInputStyle.Paragraph}
          value={defaultShiftNotes}
          required
        />
      </Label>
    </Modal>
  );
  await interaction.showModal(modal);
};

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  const input = interaction.options.getString("kiedy", true);

  if (!input) {
    const fallbackAutoComp: ApplicationCommandOptionChoiceData[] = [];

    for (let i = 1; i <= 25; i++) {
      const defaultShiftTime = other.shifts.defaultShiftTime.split(":");

      if (!defaultShiftTime[0] || !defaultShiftTime[1]) {
        await interaction.respond([]);
        return;
      }

      const dateHelper = (num: number) => {
        if (num < 10) {
          return `0${num}`;
        }
        return num;
      };

      const now = new Date();

      const defaultDate = fromZonedTime(
        "".concat(
          ...[
            now.getFullYear(),
            "-",
            dateHelper(now.getMonth() + 1),
            "-",
            dateHelper(now.getDate()),
            " ",
            defaultShiftTime[0],
            ":",
            defaultShiftTime[1],
            ":00",
          ].map((v) => v.toString()),
        ),
        sharedConfig.timezone,
      );

      const newDate = addDays(defaultDate, i - 1);

      fallbackAutoComp.push({
        name: formatDate(newDate, "dd/MM/yyyy HH:mm"),
        value: newDate.toISOString(),
      });
    }
    await interaction.respond(fallbackAutoComp);
  } else {
    await interaction.respond([{ name: input, value: input }]);
  }
};
