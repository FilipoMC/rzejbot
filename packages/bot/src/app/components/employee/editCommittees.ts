import { ApiHelper } from "@/helper/apiHelper";
import { ApiHelperReturnData } from "@/types/apiHelper";
import {
  commandError,
  commandSuccess,
  loading,
} from "@/utils/commandResponses";
import { allRanks, getGroupsForRank, rankGroups } from "@shared/config/ranks";
import { OtherEmployeeRanks } from "@shared/types/api";
import { OnModalKitSubmit } from "commandkit";
import { ChatInputCommandInteraction, ComponentType } from "discord.js";
import { displayEditEmpEmbed } from "./displayEditEmpEmbed";

function compareCommittees(
  currentCommittees: OtherEmployeeRanks[],
  newCommmittees: OtherEmployeeRanks[],
  gettingChanged: Array<keyof typeof rankGroups>,
) {
  // Logger.debug([
  //   "comparecommitt func",
  //   currentCommittees,
  //   newCommmittees,
  //   gettingChanged,
  // ]);
  const final: OtherEmployeeRanks[] = [];
  gettingChanged
    .map((groupName) => {
      const groupRanks = rankGroups[groupName].ranks;
      const currentRank =
        currentCommittees.filter((r) => (groupRanks as string[]).includes(r)) ??
        [];
      const newRank =
        newCommmittees.filter((r) => (groupRanks as string[]).includes(r)) ??
        [];

      if (newRank.length > 0) {
        // New rank(s) in this group replace previous rank(s) in this group
        final.push(...newRank);
      } else if (currentRank.length > 0) {
        // If this group is in targetGroups and has no new rank, remove it
        if (!gettingChanged.includes(groupName)) {
          final.push(...currentRank);
        }
      }
    })
    .filter((e) => e !== null);
  currentCommittees
    .filter((c) => getGroupsForRank(c).map((g) => g.group.name))
    .forEach((c) => final.push(c));
  return final;
}

export const editCommitteesHandler =
  (
    employee: ApiHelperReturnData<typeof ApiHelper.employee.update>,
    originalInteraction: ChatInputCommandInteraction,
  ): OnModalKitSubmit =>
  async (interaction, ctx) => {
    await loading({
      interactionOrMsg: interaction,
      description: undefined,
    });

    const newCommittees = interaction.fields.fields
      .map((modalData) => {
        if (modalData.type === ComponentType.StringSelect) {
          return {
            customId: modalData.customId.replaceAll("_", " "),
            values: modalData.values.map((r) => r.replaceAll("_", " ")),
          };
        } else {
          throw "How?";
        }
      })
      .flat();
    // Logger.debug(JSON.stringify(newCommittees, null, 2));
    const temp = compareCommittees(
      employee.committees,
      newCommittees.flatMap((c) => c.values) as OtherEmployeeRanks[],
      newCommittees.flatMap((c) => c.customId) as Array<
        keyof typeof rankGroups
      >,
    );
    // Logger.debug(["editcomhandler", temp]);

    const res = await ApiHelper.employee.update(employee.discordId, {
      committees: temp,
    });
    if (res.status !== "ok") {
      await commandError({
        interactionOrMsg: interaction,
        description: "Wystąpił błąd podczas zapisywania zmian w bazie danych",
      });
      return;
    }

    const rolesToAdd: string[] = [];
    for (const committee of newCommittees.flatMap((c) => c.values)) {
      rolesToAdd.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
      );
      rolesToAdd.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
      );
    }

    const rolesToRemoveLoop: string[] = [];
    for (const committee of employee.committees) {
      rolesToRemoveLoop.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
      );
      rolesToRemoveLoop.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
      );
    }
    const rolesToRemove = [...new Set(rolesToRemoveLoop)];
    // Logger.debug(["R+", rolesToAdd].join("\n"));
    // Logger.debug(["R-", rolesToRemove].join("\n"));
    const final = {
      add: rolesToAdd.filter((e) => !rolesToRemove.includes(e)),
      rm: rolesToRemove.filter((e) => !rolesToAdd.includes(e)),
    };
    // Logger.debug({
    //   add: final.add.map((e) => `<@&${e}>`),
    //   rm: final.rm.map((e) => `<@&${e}>`),
    // });

    const employeeDc = await interaction.guild?.members.fetch(
      employee.discordId,
    );
    if (!employeeDc) {
      await commandError({
        interactionOrMsg: interaction,
        description:
          "Nawet deweloperzy nie wiedzą jak to jest możliwe, spróbuj ponownie.",
      });
      throw "Jakim cudem employeeDc jest undefined???\n" + import.meta.filename;
    }
    await employeeDc.roles.remove(final.rm);
    await employeeDc.roles.add(final.add);

    await commandSuccess({
      interactionOrMsg: interaction,
      description: "Pomyślnie zmieniono komisje pracownika",
    });
    setTimeout(async () => await interaction.deleteReply(), 10 * 1000);
    await originalInteraction.editReply({
      embeds: [
        displayEditEmpEmbed(
          employeeDc.user,
          res.data,
          interaction.guild?.roles.cache.get(
            allRanks[res.data.employeeChanges[0]!.newRole],
          )?.colors.primaryColor ?? "Blurple",
        ),
      ],
    });

    ctx.dispose();
    return;
  };
