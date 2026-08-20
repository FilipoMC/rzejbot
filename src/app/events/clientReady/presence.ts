import { EventHandler } from "commandkit";
import { updateBotPresence } from "@/utils/utilityFunctions";

export const once = true;

const handler: EventHandler<"clientReady"> = (client) => {
  updateBotPresence(client);
};

export default handler;
