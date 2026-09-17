import { task } from "@commandkit/tasks";
import { sendShiftManageEmbed } from "../components/zmiana/manageShiftEmbed";
import { ApiHelper } from "@/helper/apiHelper";
import { shiftEventName } from "@/config/script";
import { GuildScheduledEventStatus } from "discord.js";

export interface PrepareShiftBriefingTaskData {
  shiftIdentifier: NonNullable<
    Parameters<typeof sendShiftManageEmbed>["0"]["shiftIdentifier"]
  >;
  guildId: string;
}

export default task<PrepareShiftBriefingTaskData>({
  name: "prepare-shift-briefing",
  async execute(ctx) {
    const { shiftIdentifier, guildId } = ctx.data;

    let shiftNumber;

    if ("number" in shiftIdentifier) {
      shiftNumber = shiftIdentifier.number;
    } else {
      const res = await ApiHelper.shifts.getById(shiftIdentifier.id);
      if (res.status === "ok") {
        shiftNumber = res.data.shiftNumber;
      } else {
        shiftNumber = null;
      }
    }

    if (shiftNumber) {
      const guild = await ctx.client.guilds.fetch(guildId);
      const event = (await guild.scheduledEvents.fetch()).find(
        (ev) => ev.name === shiftEventName(shiftNumber),
      );
      await event?.setStatus(GuildScheduledEventStatus.Active);
    }

    await sendShiftManageEmbed({
      shiftIdentifier,
      client: ctx.client,
    });
  },
});
