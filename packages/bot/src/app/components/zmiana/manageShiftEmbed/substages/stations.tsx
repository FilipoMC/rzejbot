import {
  ShiftAPIResponse,
  ShiftLogStationsGetAPIResponse,
  ShiftReportAPIResponse,
} from "@shared/types/api";
import {
  OnButtonKitClick,
  Button,
  ButtonKit,
  Modal,
  UserSelectMenu,
  Label,
  Logger,
  OnModalKitSubmit,
  TextInput,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  TextInputStyle,
  User,
  userMention,
} from "discord.js";
import type { createManageShiftEmbedStage2Components } from "../stage2";
import type { createManageShiftEmbedStage3Components } from "../stage3";
import { stationsGrouped } from "@shared/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import { commandError, success } from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import { Tuple } from "@shared/types/utils";
import {
  disposeShiftHandlers,
  shiftManageEmbedComponentsFilter,
  registerButtonHandler,
  getShiftManageEmbed,
  replaceModalHandler,
} from "../utils";
import { nameICSchema } from "@shared/zod/employeeSchemas";

export function createManageShiftEmbedSetStationsComponents(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
  stations: ShiftLogStationsGetAPIResponse,
  createCurrentStageComponents:
    | typeof createManageShiftEmbedStage2Components
    | typeof createManageShiftEmbedStage3Components,
  date?: Date,
) {
  date ??= new Date();

  disposeShiftHandlers(shift.id);

  const backButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    await Promise.all([
      interaction.deferUpdate(),
      interaction.message.edit({
        components: createCurrentStageComponents(shift, shiftReport, stations),
      }),
    ]);

    ctx.dispose();
  };

  const backButton = (
    <Button
      customId={`back-stations_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={backButtonCallback}
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
    >
      « Powrót
    </Button>
  );

  registerButtonHandler(shift.id, backButton);

  const createButtonCallback = (
    stationNames: Set<string>,
    group: string,
  ): OnButtonKitClick => {
    return async (interaction, ctx) => {
      const onModalSubmit: OnModalKitSubmit = async (
        modalInteraction,
        modalCtx,
      ) => {
        const entries = modalInteraction.fields.fields
          .map((v, station) => {
            if (v.type !== ComponentType.UserSelect) {
              throw new Error(
                "this doesnt happen thanks to the filter above... i hope at least",
              );
            }

            return { station, user: v.users?.at(0) };
          })
          .filter(
            (v): v is { station: string; user: User } => v.user !== undefined,
          );

        const [logRes, newStationsRes] = await deferAfter(
          modalInteraction,
          (async () => {
            return [
              await ApiHelper.shifts.stations.log(
                shift.id,
                entries.map((v) => {
                  return {
                    employee: v.user.id,
                    station: v.station,
                    date,
                  };
                }),
              ),
              await ApiHelper.shifts.stations.get(shift.id),
            ];
          })(),
        );

        if (logRes.status !== "ok") {
          Logger.error(logRes);
          await commandError({
            interactionOrMsg: interaction,
            description: logRes.error ?? "Błąd podczas komunikacji z serwerem.",
            useFollowUp: true,
          });
        }

        if (newStationsRes.status !== "ok") {
          Logger.error(newStationsRes);
          await commandError({
            interactionOrMsg: interaction,
            description:
              newStationsRes.error ?? "Błąd podczas komunikacji z serwerem.",
            useFollowUp: true,
          });
        }

        if (logRes.status !== "ok" || newStationsRes.status !== "ok") {
          return;
        }

        const newStations = newStationsRes.data;

        const usersNotFound = logRes.data
          .filter((v) => !v.found)
          .map((v) =>
            v.employeeDiscordId ?
              userMention(v.employeeDiscordId)
            : v.employeeNameIC,
          )
          .join(", ");

        if (usersNotFound.length > 0) {
          await success({
            description:
              usersNotFound +
              " nie są w rejestrze pracowników. Pozostałe stanowiska zostały przydzielone.",
            interactionOrMsg: modalInteraction,
            useFollowUp: true,
          });
        }

        modalCtx.dispose();

        await interaction.message.edit({
          embeds: [getShiftManageEmbed(shift, shiftReport, newStations)],
          components: createManageShiftEmbedSetStationsComponents(
            shift,
            shiftReport,
            newStations,
            createCurrentStageComponents,
            date,
          ),
        });
      };

      const stationNamesArr = [...stationNames];

      if (stationNamesArr.length > 5) {
        Logger.error({
          msg: "more than 5 station names passed in group",
          component: "zmiana/stations",
          group,
        });
      }

      const modal = (
        <Modal
          title="Przydziel stanowiska"
          customId={`stations-${group}-modal_${shift.id}`}
          onSubmit={onModalSubmit}
          options={{ once: false, filter: shiftManageEmbedComponentsFilter }}
        >
          {stationNamesArr.slice(0, 5).map((station) => {
            return (
              <Label label={station}>
                <UserSelectMenu
                  customId={station}
                  placeholder="Wybierz pracownika"
                  minValues={1}
                  maxValues={1}
                />
              </Label>
            );
          })}
        </Modal>
      );

      replaceModalHandler(shift.id, modal);

      await interaction.showModal(modal);

      ctx.dispose();

      setImmediate(() => {
        interaction.message.edit({
          components: createManageShiftEmbedSetStationsComponents(
            shift,
            shiftReport,
            stations,
            createCurrentStageComponents,
            date,
          ),
        });
      });
    };
  };

  const customButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      const entries = modalInteraction.fields.getTextInputValue("input");

      const [logRes, newStationsRes] = await deferAfter(
        modalInteraction,
        (async () => {
          return [
            await ApiHelper.shifts.stations.log(
              shift.id,
              entries
                .split("\n")
                .filter((v) => {
                  const split = v.split(" - ");

                  return (
                    split.length === 2 &&
                    nameICSchema.safeParse(split[1]).success
                  );
                })
                .map((v) => {
                  const [station, employee] = v.split(" - ") as Tuple<
                    string,
                    2
                  >;

                  return {
                    employee,
                    station,
                    date,
                  };
                }),
            ),
            await ApiHelper.shifts.stations.get(shift.id),
          ];
        })(),
      );

      if (logRes.status !== "ok") {
        Logger.error(logRes);
        await commandError({
          interactionOrMsg: interaction,
          description: logRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (newStationsRes.status !== "ok") {
        Logger.error(newStationsRes);
        await commandError({
          interactionOrMsg: interaction,
          description:
            newStationsRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (logRes.status !== "ok" || newStationsRes.status !== "ok") {
        return;
      }

      const newStations = newStationsRes.data;

      const usersNotFound = logRes.data
        .filter((v) => !v.found)
        .map((v) =>
          v.employeeDiscordId ?
            userMention(v.employeeDiscordId)
          : v.employeeNameIC,
        )
        .join(", ");

      if (usersNotFound.length > 0) {
        await success({
          description:
            usersNotFound +
            " nie są w rejestrze pracowników. Pozostałe stanowiska zostały przydzielone.",
          interactionOrMsg: modalInteraction,
          useFollowUp: true,
        });
      }

      modalCtx.dispose();

      await interaction.message.edit({
        embeds: [getShiftManageEmbed(shift, shiftReport, newStations)],
        components: createManageShiftEmbedSetStationsComponents(
          shift,
          shiftReport,
          newStations,
          createCurrentStageComponents,
          date,
        ),
      });
    };

    const modal = (
      <Modal
        title="Przydziel stanowiska"
        customId={`stations-custom-modal_${shift.id}`}
        onSubmit={onModalSubmit}
        options={{ once: false, filter: shiftManageEmbedComponentsFilter }}
      >
        <Label label="Przydział">
          <TextInput
            customId="input"
            placeholder="Dodatkowe stanowiska w formacie&#10;stanowisko - rp name pracownika&#10;stanowisko - rp name pracownika"
            style={TextInputStyle.Paragraph}
            required
          />
        </Label>
      </Modal>
    );

    replaceModalHandler(shift.id, modal);

    await interaction.showModal(modal);

    ctx.dispose();

    setImmediate(() => {
      interaction.message.edit({
        components: createManageShiftEmbedSetStationsComponents(
          shift,
          shiftReport,
          stations,
          createCurrentStageComponents,
          date,
        ),
      });
    });
  };

  const actionRowsContent = [[backButton]];

  for (const [idx, [group, stationEntries]] of Object.entries(
    stationsGrouped,
  ).entries()) {
    if (idx >= 23) {
      Logger.error({ msg: `Too many stations`, component: "zmiana/stations" });
      break;
    }

    const button = (
      <Button
        customId={`stations-${group.replace("_", "+")}-modal_${shift.id}`}
        onClick={createButtonCallback(
          new Set(stationEntries.map((v) => v.name)),
          group,
        )}
        options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
      >
        {group.replaceAll("_", " ")}
      </Button>
    );

    registerButtonHandler(shift.id, button);

    if (idx < 4) {
      actionRowsContent[0]?.push(button);
      continue;
    }

    const rowIndex = Math.floor((idx - 4) / 5) + 1;

    if (!actionRowsContent[rowIndex]) {
      actionRowsContent.push([]);
    }

    actionRowsContent[rowIndex]?.push(button);
  }

  const customButton = (
    <Button
      customId={`stations-custom-modal_${shift.id}`}
      onClick={customButtonCallback}
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
    >
      Własne
    </Button>
  );

  registerButtonHandler(shift.id, customButton);

  actionRowsContent.at(-1)!.push(customButton);

  return actionRowsContent.map((v) =>
    new ActionRowBuilder<ButtonKit>().setComponents(v),
  );
}
