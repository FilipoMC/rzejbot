import {
  ChatInputCommand,
  CommandData,
  Label,
  Logger,
  Modal,
  OnModalKitSubmit,
  StringSelectMenu,
  StringSelectMenuOption,
  TextInput,
  UserSelectMenu,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  TextInputStyle,
  userMention,
} from "discord.js";
import config from "@shared/config/config.json";
import { ApiHelper } from "@/helper/apiHelper";
import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";
import z from "zod";
import {
  commandError,
  failedToExecute,
  loading,
  success,
} from "@/utils/commandResponses";

export const command: CommandData = {
  name: "dodaj",
  description: "dodaj pracownika",
  options: [
    {
      name: "uzytkownik",
      description: "osoba do dodania",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

const modalSubmitHadler: OnModalKitSubmit = async (interaction, ctx) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await loading({ interactionOrMsg: interaction, description: undefined });

  const modalResponses = {
    user: interaction.fields.getSelectedUsers("user", true).at(0)!,
    nameIC: interaction.fields.getTextInputValue("nameIC"),
    robloxUser: interaction.fields.getTextInputValue("robloxName"),
    rank: interaction.fields.getStringSelectValues("rank")[0],
  };

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    body: JSON.stringify({
      usernames: [modalResponses.robloxUser],
      excludeBannedUsers: true,
    }),
  });

  const resParsed = robloxUsersByUsernamesAPIResponseSchema.safeParse(
    await res.json(),
  );

  if (!resParsed.success) {
    Logger.error(z.treeifyError(resParsed.error));
    return;
  }

  if (!resParsed.data.data[0]) {
    Logger.debug(JSON.stringify(resParsed, null, 2));
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Podana nazwa użytkownika Roblox nie jest poprawna",
      ephemeral: true,
    });
    ctx.dispose();
    return;
  }

  const prismaRes = await ApiHelper.employee.create({
    discordId: modalResponses.user.id,
    nameIC: modalResponses.nameIC,
    rank: modalResponses.rank || "",
    robloxId: resParsed.data.data[0]?.id,
  });

  if (prismaRes.status === "ok") {
    await success({
      interactionOrMsg: interaction,
      description: `Dodano nowego pracownika do bazy danych: ${prismaRes.data.nameIC} (${userMention(prismaRes.data.discordId)})`,
    });
  } else if (
    prismaRes.status === "apiError" &&
    prismaRes.errorStatus === "conflict"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: prismaRes.error,
    });
  } else if (prismaRes.status === "badArgument" && prismaRes.error) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description:
        "Wystąpił błąd podczas weryfikacji podanych wartości:\n\n" +
        z.prettifyError(prismaRes.error),
    });
  } else {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
  }

  ctx.dispose();
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await interaction.showModal(
    <Modal
      title="Dodaj Pracownika"
      options={{ once: false }}
      onSubmit={modalSubmitHadler}
      customId={`modalEmployeeAdd-${interaction.options.getUser("uzytkownik", true).id}`}
    >
      <Label label="Użytkownik">
        <UserSelectMenu
          required
          customId="user"
          defaultValues={interaction.options.getUser("uzytkownik", true).id}
          maxValues={1}
          minValues={1}
        />
      </Label>
      <Label label="Imię IC dla pracownika">
        <TextInput
          customId="nameIC"
          style={TextInputStyle.Short}
          placeholder="Oliwier Baran"
          required
        />
      </Label>
      <Label label="Roblox Username" description="Nie display name">
        <TextInput
          customId="robloxName"
          style={TextInputStyle.Short}
          placeholder="Pawe_320"
          required
        />
      </Label>
      <Label
        label="Ranga"
        description="Ranga którą nadać pracownikowi na start"
      >
        <StringSelectMenu required customId="rank" minValues={1} maxValues={1}>
          {Object.keys(config.ranks).map((e) => {
            return (
              <StringSelectMenuOption
                label={e}
                value={e}
                default={e === "Kandydat" ? true : false}
              />
            );
          })}
        </StringSelectMenu>
      </Label>
    </Modal>,
  );
  return;
};
