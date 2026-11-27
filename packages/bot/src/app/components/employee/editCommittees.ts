import { ApiHelper } from "@/helper/apiHelper";
import { ApiHelperReturnData } from "@/types/apiHelper";
import {
  commandError,
  commandSuccess,
  loading,
} from "@/utils/commandResponses";
import { allRanks, getGroupsForRank, rankGroups } from "@shared/config/ranks";
import { OtherEmployeeRanks } from "@shared/types/api";
import { Logger, OnModalKitSubmit } from "commandkit";
import { ChatInputCommandInteraction, ComponentType } from "discord.js";
import { displayEditEmpEmbed } from "./displayEditEmpEmbed";
import { empEditCache } from "@/app/commands/(Kierownictwo)/[pracownik]/edytuj.subcommand";

function compareCommittees(
  currentCommittees: OtherEmployeeRanks[],
  newCommittees: OtherEmployeeRanks[],
  gettingChanged: Array<keyof typeof rankGroups>,
) {
  Logger.warn([
    "comparecommitt func\n",
    currentCommittees,
    "\n\n",
    newCommittees,
    "\n\n",
    gettingChanged,
  ]);
  const final: OtherEmployeeRanks[] = [];
  const all = [...new Set([...currentCommittees, ...newCommittees])];
  while (all.length > 0) {
    const e = all.pop();
    if (!e) {
      return;
    }
    const isGettingChanged = getGroupsForRank(e)
      .map((e) => e.group.name)
      .map((g) => gettingChanged.includes(g as keyof typeof rankGroups))
      .some((e) => e === true);
    const OY = currentCommittees.includes(e);
    const ON = !currentCommittees.includes(e);
    const NY = newCommittees.includes(e);
    const NO = !newCommittees.includes(e);
    Logger.debug(
      JSON.stringify(
        [e, { isGettingChanged }, { OY }, { ON }, { NY }, { NO }],
        null,
      ),
    );
    switch (true) {
      case OY && NY:
        Logger.log("OY && NY");
        final.push(e);
        break;
      case OY && NO && !isGettingChanged:
        Logger.log("OY && NO && !isGettingChanged");
        final.push(e);
        break;
      case OY && NO && isGettingChanged:
        Logger.log("OY && NO && isGettingChanged");
        break;
      case NY && ON:
        Logger.log("NY && ON");
        final.push(e);
        break;
      default:
        Logger.error("unexp case");
    }
  }

  Logger.debug(final);
  return [...new Set(final)];
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
    if (!empEditCache.has(employee.discordId)) {
      empEditCache.set(employee.discordId, employee, 10 * 60 * 1000);
    }
    const newCommittees = interaction.fields.fields
      .map((modalData) => {
        if (modalData.type === ComponentType.StringSelect) {
          return {
            customId: {
              group: modalData.customId.replaceAll("_", " ").split("-")[0],
              rank: modalData.customId.replaceAll("_", " ").split("-")[1],
            },
            values: modalData.values.map((r) => r.replaceAll("_", " ")),
          };
        } else {
          throw "How?";
        }
      })
      .flat();
    Logger.debug(JSON.stringify(newCommittees, null, 2));
    const temp = compareCommittees(
      empEditCache.get(employee.discordId)?.committees ?? employee.committees,
      newCommittees.flatMap((c) => c.values) as OtherEmployeeRanks[],
      newCommittees.flatMap((c) => c.customId.group) as Array<
        keyof typeof rankGroups
      >,
    );
    Logger.debug(["editcomhandler", temp]);

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
    empEditCache.set(res.data.discordId, res.data, 10 * 60 * 1000);

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
    // await employeeDc.roles.remove(final.rm);
    // await employeeDc.roles.add(final.add);

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
