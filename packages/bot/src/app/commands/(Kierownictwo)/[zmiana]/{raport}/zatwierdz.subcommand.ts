import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  commandSuccess,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType, Channel, hyperlink } from "discord.js";
import channels from "@/config/channels";
import { websitePages } from "@/config/script";
import { mainRanks, rankGroups } from "@shared/config/ranks";
import { CustomCommandMetadata } from "@/types/commands";

export const command: CommandData = {
  name: "zatwierdz",
  description: "Zatwierdź raport zmiany.",
  options: [
    {
      name: "zmiana",
      description: "Numer zmiany w formacie XXX/YY",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Pobieranie zmiany...",
  });
  const shiftNumber = interaction.options.getString("zmiana", true);

  if (!interaction.inCachedGuild()) {
    return;
  }

  await interaction.member.fetch();

  const roles = interaction.member.roles.cache;

  const isME = roles.has(mainRanks["Główny Inżynier Elektrowni"]);
  const isUM =
    roles.has(mainRanks["Kierownik Bloków"]) ||
    roles.has(mainRanks["p.o. Kierownika Bloków"]);

  if (!isME && !isUM) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Nie jesteś GI ani KB",
    });
    return;
  }

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

  await loading({
    interactionOrMsg: interaction,
    description: "Aktualizowanie stanu zmiany...",
  });

  const shift = shiftRes.data;

  const reportRes = await ApiHelper.shifts.report.changeApproval(shift.id, {
    approved: isME ? true : undefined,
    approvedByUM: isUM ? true : undefined,
  });

  if (reportRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas aktualizowania stanu zmiany.",
    });
    return;
  }

  await loading({
    interactionOrMsg: interaction,
    description: "Wysyłanie stosownych wiadomości...",
  });

  const stuffToSend: Array<{ channel: Channel | null; content: string }> = [];

  if (isUM) {
    const channel = await interaction.client.channels.fetch(
      channels.kierownicy_zmian,
    );

    const content = `${hyperlink(`Raport ze zmiany ${shift.shiftNumber}`, websitePages.shiftReport(shift.shiftNumber))} został zatwierdzony przez Kierownika Bloków`;

    stuffToSend.push({ channel, content });
  }

  if (isME) {
    const channel = await interaction.client.channels.fetch(channels.raporty);

    const content = websitePages.shiftReport(shift.shiftNumber);

    stuffToSend.push({ channel, content });
  }

  let success = true;

  for (const { channel, content } of stuffToSend) {
    try {
      if (channel?.isSendable()) {
        await channel.send(content);
      } else {
        throw "tak";
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      success = false;
    }
  }

  if (success) {
    await commandSuccess({
      interactionOrMsg: interaction,
      description: undefined,
    });
  } else {
    await commandError({
      interactionOrMsg: interaction,
      description: `Wysłanie raportu nie powiodło się, lecz jest on zatwierdzony; proszę wysłać go ręcznie: ${websitePages.shiftReport(shift.shiftNumber)}`,
    });
  }
};

export const metadata: CustomCommandMetadata = {
  skipLocalMiddleware: true,
  permissions: {
    allowedRoles: [
      rankGroups["Kierownictwo Elektrowni"].id,
      rankGroups["Kierownictwo Bloków"].id,
    ],
  },
};
