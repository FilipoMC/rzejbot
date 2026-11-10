import channels from "@/config/channels";
import config from "@/config/config";
import emoji from "@/config/emoji";
import { kvKeys } from "@/config/other";
import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  commandSuccess,
  failedToExecute,
} from "@/utils/commandResponses";
import kv from "@/utils/kv";
import { fetchChannelResolvable } from "@/utils/utilityFunctions";
import { ShiftLogPresencePost } from "@shared/types/api";
import {
  Button,
  ButtonKit,
  EventHandler,
  Logger,
  OnButtonKitClick,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  userMention,
  VoiceState,
} from "discord.js";

const handler: EventHandler<"voiceStateUpdate"> = async (
  oldState,
  newState,
  client,
) => {
  const shiftHostId = kv.get(kvKeys.other.activeShiftHostId);
  if (!shiftHostId) {
    return;
  }

  const zmianaVCIds = Object.values(channels.zmianaVC);

  const isZmianaVc = (id: string | null) => id && zmianaVCIds.includes(id);
  const isZmianaVcState = (state: VoiceState) => isZmianaVc(state.channelId);

  if (!oldState.channelId && !oldState.channelId) {
    return;
  }

  if (
    (isZmianaVcState(oldState) && isZmianaVcState(newState)) ||
    (!isZmianaVcState(oldState) && !isZmianaVcState(newState))
  ) {
    return;
  }

  let action: ShiftLogPresencePost[number]["action"];

  if (!isZmianaVcState(oldState) && isZmianaVcState(newState)) {
    action = "clock_in";
  } else if (isZmianaVcState(oldState) && !isZmianaVcState(newState)) {
    action = "clock_out";
  } else {
    return;
  }

  const callback: OnButtonKitClick = async (interaction, ctx) => {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await interaction.deferReply({ flags: "Ephemeral" });

    const shift = await ApiHelper.shifts.getActive();

    if (shift.status === "apiError" && shift.errorStatus === "notFound") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description:
          ":sick: jak do tego doszło nie wiem (musisz klikać w guziki jak jeszcze działa zmiana, brawo ty) (teraz do deweloperów idź przymilić to może naprawią)",
      });
      ctx.dispose();
      return;
    }

    if (shift.status !== "ok") {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
      return;
    }

    const logRes = await ApiHelper.shifts.logEmployeePresence(shift.data.id, [
      { employee: newState.id, action },
    ]);

    if (logRes.status !== "ok") {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
    } else {
      ctx.dispose();

      commandSuccess({
        interactionOrMsg: interaction,
        description: undefined,
      });
      setTimeout(() => {
        interaction.message.delete().catch(() => null);
        interaction.deleteReply().catch(() => null);
      }, 10000);
    }
  };

  const confirmButton = (
    <Button
      customId={`obecnosc_potwierdz_${shiftHostId}_${action.replaceAll("_", "+")}-${oldState?.member?.id ?? newState?.member?.id}`}
      onClick={callback}
      options={{
        filter: (itx) =>
          itx.user.id === shiftHostId || config.devs.includes(itx.user.id),
      }}
      style={ButtonStyle.Success}
    >
      Potwierdź
    </Button>
  );

  const rejectButton = (
    <Button
      customId={`obecnosc_odrzuc_${shiftHostId}_${action.replaceAll("_", "+")}-${oldState?.member?.id ?? newState?.member?.id}`}
      onClick={(itx, ctx) => {
        itx.message.delete().catch(() => null);
        ctx.dispose();
      }}
      options={{
        filter: (itx) =>
          itx.user.id === shiftHostId || config.devs.includes(itx.user.id),
      }}
      style={ButtonStyle.Danger}
    >
      Odrzuć
    </Button>
  );

  const channel = await fetchChannelResolvable(
    channels.kierownicy_zmian,
    client,
  );

  if (!channel?.isSendable()) {
    Logger.error({
      msg: "Niepoprawny kanał w configu",
      path: "channels.kierownicy_zmian",
    });
    return;
  }

  if (action === "clock_in") {
    await channel.send({
      content: `${emoji.yes} WEJŚCIE ${newState.member?.user} (${newState.member?.displayName ?? newState.member?.user.username})\n-# ||${userMention(shiftHostId)}||`,
      components: [
        new ActionRowBuilder<ButtonKit>().setComponents([
          confirmButton,
          rejectButton,
        ]),
      ],
    });
  } else if (action === "clock_out") {
    await channel.send({
      content: `${emoji.no} WYJŚCIE ${newState.member?.user} (${newState.member?.displayName ?? newState.member?.user.username})\n-# ||${userMention(shiftHostId)}||`,
      components: [
        new ActionRowBuilder<ButtonKit>().setComponents([
          confirmButton,
          rejectButton,
        ]),
      ],
    });
  }
};

export default handler;
