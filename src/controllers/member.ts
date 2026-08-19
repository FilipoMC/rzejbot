import { Client, GuildMember, Snowflake } from "discord.js";

export class MemberManager {
  public cache = new Map<Snowflake, GuildMember>();

  constructor(private client: Client) {
    this.client.on("guildMemberUpdate", (_, newMember) => {
      this.cache.set(newMember.id, newMember);
    });
  }
}