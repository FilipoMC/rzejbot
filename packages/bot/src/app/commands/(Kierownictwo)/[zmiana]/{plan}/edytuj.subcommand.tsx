import channels from "@/config/channels";
import { websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  commandSuccess,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { createCommandErrorEmbed, createFailEmbed } from "@/utils/embeds";
import { fetchChannelResolvable } from "@/utils/utilityFunctions";
import { mainRanks } from "@shared/config/ranks";
import {
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
import {
  ApplicationCommandOptionType,
  codeBlock,
  EmbedBuilder,
  hyperlink,
  MessageFlags,
  roleMention,
  TextInputStyle,
} from "discord.js";

export const command: CommandData = {
  name: "edytuj",
  description: "Edytuj plan zmiany",
  options: [
    {
      name: "numer",
      description: "Numer zmiany w formacie XXX/YY",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "briefing",
      description: `Długość briefingu.`,
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "zmiana",
      description: `Długość zmiany.`,
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  const shiftNumberUnparsed = interaction.options.getString("numer", true);
  const briefingDuration = interaction.options.getNumber("briefing");
  const shiftDuration = interaction.options.getNumber("zmiana");

  const shiftRes = await ApiHelper.shifts.getByShiftNumber(shiftNumberUnparsed);

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

  const modalHandler: OnModalKitSubmit = async (modalInteraction, ctx) => {
    if (!modalInteraction.inCachedGuild()) {
      ctx.dispose();
      return;
    }

    const shiftHost = modalInteraction.fields
      .getSelectedUsers("shiftHost")
      ?.at(0);
    const unitUnparsed = modalInteraction.fields.getRadioGroup("unit");
    const shiftGoal =
      modalInteraction.fields.getTextInputValue("shiftGoal") || undefined;
    const notes =
      modalInteraction.fields.getTextInputValue("notes") || undefined;

    const unit =
      unitUnparsed === "1" ? "I"
      : unitUnparsed === "2" ? "II"
      : unitUnparsed === "3" ? "I/II"
      : undefined;

    await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });
    await loading({
      interactionOrMsg: modalInteraction,
      description: undefined,
    });

    const res = await ApiHelper.shifts.update(shift.id, {
      unit,
      host: shiftHost?.id,
      shiftGoal,
      notes,
      plannedDuration: shiftDuration ?? undefined,
      plannedBriefingDuration: briefingDuration ?? undefined,
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
        embed = createCommandErrorEmbed(
          "Wystąpił błąd podczas komunikacji z serwerem.",
        );
      }

      embed.setDescription(
        embed.data.description + "\n\nWprowadzone dane znajdują się poniżej",
      );

      await interaction.followUp({
        embeds: [
          embed,
          new EmbedBuilder().setDescription(codeBlock(shiftGoal ?? "")),
          new EmbedBuilder().setDescription(codeBlock(notes ?? "")),
        ],
      });

      ctx.dispose();
      return;
    }

    const channel = await fetchChannelResolvable(
      channels.kierownicy_zmian,
      interaction.client,
    );

    if (!channel?.isSendable()) {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
      return;
    }

    await channel.send(
      `**${res.data.shiftNumber}** - edytowano ${hyperlink("plan zmiany", websitePages.shiftPlan(res.data.shiftNumber))}\n-# ||${roleMention(mainRanks["Główny Inżynier Elektrowni"])}||`,
    );

    await commandSuccess({
      interactionOrMsg: modalInteraction,
      description: `Pomyślnie edytowano plan zmiany ${shift.shiftNumber}.`,
    });

    ctx.dispose();
  };

  const modal = (
    <Modal
      title="Edytuj zmianę"
      onSubmit={modalHandler}
      customId={`editShift_${interaction.user.id}_${shift.shiftNumber}`}
    >
      <Label label="Kierownik zmiany">
        <UserSelectMenu
          customId="shiftHost"
          minValues={1}
          maxValues={1}
          defaultValues={[shift.host.discordId]}
        />
      </Label>
      <Label label="Unit, na którym zmiana będzie miała miejsce">
        <RadioGroup customId="unit">
          <RadioGroupOption
            label="Unit I"
            value="1"
            default={shift.unit === "I"}
          />
          <RadioGroupOption
            label="Unit II"
            value="2"
            default={shift.unit === "II"}
          />
          <RadioGroupOption
            label="Unit I/II"
            value="3"
            default={shift.unit === "I/II"}
          />
        </RadioGroup>
      </Label>
      <Label label="Cel Zmiany">
        <TextInput
          customId="shiftGoal"
          style={TextInputStyle.Paragraph}
          value={shift.shiftGoal}
        />
      </Label>
      <Label label="Instrukcje i Uwagi">
        <TextInput
          customId="notes"
          style={TextInputStyle.Paragraph}
          value={shift.notes}
        />
      </Label>
    </Modal>
  );
  await interaction.showModal(modal);
};
