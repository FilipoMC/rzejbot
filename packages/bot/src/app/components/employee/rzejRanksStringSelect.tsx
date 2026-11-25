import {
  CommandKitSelectMenuBuilderInteractionCollectorDispatch,
  StringSelectMenu,
  StringSelectMenuKit,
  StringSelectMenuOption,
} from "commandkit";
import { EmployeeRanks } from "@shared/types/api";
import { mainRanks } from "@shared/config/ranks";
import { CacheType } from "discord.js";
import { StringSelectMenuInteraction } from "discord.js";

export default function RzejEmployeeRanksStringSelect({
  customId = "rank",
  defaultRank = "Operator Niejądrowy",
  handler,
}: {
  customId?: string;
  defaultRank?: EmployeeRanks;
  handler?: CommandKitSelectMenuBuilderInteractionCollectorDispatch<
    StringSelectMenuInteraction<CacheType>,
    StringSelectMenuKit
  >;
}) {
  return (
    <StringSelectMenu
      required
      customId={customId}
      minValues={1}
      maxValues={1}
      onSelect={handler}
    >
      {Object.keys(mainRanks).map((e) => {
        return (
          <StringSelectMenuOption
            label={e}
            value={e.replaceAll(" ", "_")}
            default={e === defaultRank}
          />
        );
      })}
    </StringSelectMenu>
  );
}
