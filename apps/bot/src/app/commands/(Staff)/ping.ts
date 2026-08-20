import { success } from "@/utils/commandResponses";
import { type ChatInputCommand, type MessageCommand, type CommandData } from "commandkit";

export const command: CommandData = {
  name: "ping",
  description: "Ping the bot to check if it's online.",
};

export const chatInput: ChatInputCommand = async (ctx) => {
  const latency = (ctx.client.ws.ping ?? -1).toString();
  const response = `Pong! Latency: ${latency}ms`;
  await success({interactionOrMsg: ctx.interaction, description: response, ephemeral: false})
};

export const message: MessageCommand = async (ctx) => {
  const {message} = ctx
  const latency = (ctx.client.ws.ping ?? -1).toString();
  const response = `Pong! Latency: ${latency}ms`;
  
  //await ctx.message.reply(response);
  await success({description: response, interactionOrMsg: message})
};
