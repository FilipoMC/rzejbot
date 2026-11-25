import {
  EmployeeAPIResponse,
  EmployeePatch,
  OtherEmployeeRanks,
} from "@shared/types/api";
import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  User,
} from "discord.js";
import emoji from "@/config/emoji";
import { ApiHelper } from "@/helper/apiHelper";
import {
  loading,
  failedToExecute,
  commandSuccess,
  commandError,
} from "@/utils/commandResponses";
import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";
import { OnModalKitSubmit } from "commandkit";
import z from "zod";
import {
  allRanks,
  getGroupsForRank,
  rankGroups,
  shortAcademicTitleNames,
} from "@shared/config/ranks";

export function displayEditEmpEmbed(
  user: User,
  employee: EmployeeAPIResponse,
  color: ColorResolvable,
) {
  const decideEmoji = (bool: boolean) => (bool ? emoji.yes : emoji.no);
  const academicTitle = employee.committees.filter((e) =>
    (rankGroups["Stopnie I Tytuły"].ranks as string[]).includes(e),
  )[0] as "Profesor" | "Doktor Habilitowany" | "Doktor" | "";
  const shortAcademicTitle =
    academicTitle === "" ? "" : shortAcademicTitleNames[academicTitle];

  const additionalRoles = new Map<
    keyof typeof rankGroups,
    OtherEmployeeRanks[]
  >();
  // Logger.warn(employee.committees);
  employee.committees.forEach((c) => {
    // Logger.warn(["db foreach 'c'", c]);
    const groupsForRole: Array<keyof typeof rankGroups> = getGroupsForRank(
      c,
    ).map((e) => {
      // Logger.debug(["groupsfrorole map 'e'", JSON.stringify(e, null, 2)]);
      return e.group.name as keyof typeof rankGroups;
    });
    groupsForRole.forEach((g) => {
      // Logger.debug(["groupsforrole 'g'", g]);
      // Logger.debug(["groupsforrole 'groupsForRole'", groupsForRole]);
      const doesKeyExist = additionalRoles.has(g);
      if (doesKeyExist) {
        additionalRoles.set(g, [...additionalRoles.get(g)!, c]);
      } else {
        additionalRoles.set(g, [c]);
      }
      // Logger.debug([
      //   "groupsforrole addit. map",
      //   JSON.stringify(Object.fromEntries(additionalRoles), null, 2),
      // ]);
    });
  });

  // Logger.debug(JSON.stringify(Object.fromEntries(additionalRoles), null, 2));
  const additionalRolesFormatted = additionalRoles
    .entries()
    .toArray()
    .map(([group, roles]) => {
      return `### ${group}\n\n${roles.join(", ")}`;
    });
  return new EmbedBuilder()
    .setTitle(
      `${employee.employeeChanges[0]?.newRole} ${shortAcademicTitle ?? ""} ${employee.nameIC}`,
    )
    .setColor(color)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(`\n ${additionalRolesFormatted.join("\n")}`)
    .addFields([
      {
        name: "Kwalifikacje/Uprawnienia",
        value: [
          `Pracownik: ${decideEmoji(employee.qualification.pracownik)}`,
          `Jądrowy: ${decideEmoji(employee.qualification.jadrowy)}`,
          `Kierownik Zmiany: ${decideEmoji(employee.qualification.kierownikZmiany)}`,
          `Szkoleniowiec: ${decideEmoji(employee.qualification.szkoleniowiec)}`,
        ].join("\n"),
      },
    ]);
}

export const empEditModalHandler =
  (originalInteraction: ChatInputCommandInteraction): OnModalKitSubmit =>
  async (interaction, ctx) => {
    await loading({
      interactionOrMsg: interaction,
      description: "Wpisywanie do bazy danych i wysyłanie wiadomości",
    });
    const modalResponses = {
      user: interaction.fields.getSelectedUsers("user", true).at(0)!,
      nameIC: interaction.fields.getTextInputValue("nameIC"),
      robloxUser: interaction.fields.getTextInputValue("robloxName"),
      qual: interaction.fields.getCheckboxGroup("qualification"),
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
      return;
    }

    if (!resParsed.data.data[0]) {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: "Podana nazwa użytkownika Roblox nie jest poprawna",
        ephemeral: true,
      });
      ctx.dispose();
      return;
    }

    const returnObj: Record<string, boolean> = {
      jadrowy: false,
      kierownikZmiany: false,
      pracownik: false,
      szkoleniowiec: false,
    } satisfies Required<NonNullable<EmployeePatch["qualification"]>["update"]>;
    for (const e of modalResponses.qual) {
      returnObj[e] = true;
    }

    const prismaRes = await ApiHelper.employee.update(modalResponses.user.id, {
      discordId: modalResponses.user.id,
      nameIC: modalResponses.nameIC,
      robloxId: resParsed.data.data[0]?.id,
      qualification: {
        update: returnObj,
      },
    });

    if (prismaRes.status === "badArgument" && prismaRes.error) {
      await commandError({
        interactionOrMsg: interaction,
        description:
          "Wystąpił błąd podczas weryfikacji podanych wartości:\n\n" +
          z.prettifyError(prismaRes.error),
      });
      return;
    } else if (
      prismaRes.status === "apiError" &&
      prismaRes.errorStatus === "notFound"
    ) {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: prismaRes.error,
      });
      return;
    } else if (
      prismaRes.status === "apiError" &&
      prismaRes.errorStatus === "conflict"
    ) {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: prismaRes.error,
      });
      return;
    } else if (prismaRes.status !== "ok") {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
      return;
    }

    if (prismaRes.status !== "ok") {
      return;
    }

    await commandSuccess({
      interactionOrMsg: interaction,
      description: "Pomyślnie zapisano zmiany w bazie danych",
    });
    setTimeout(async () => await interaction.deleteReply(), 10 * 1000);
    await originalInteraction.editReply({
      embeds: [
        displayEditEmpEmbed(
          modalResponses.user,
          prismaRes.data,
          interaction.guild?.roles.cache.get(
            allRanks[prismaRes.data.employeeChanges[0]!.newRole],
          )?.colors.primaryColor ?? "Blurple",
        ),
      ],
    });

    ctx.dispose();
    return;
  };
