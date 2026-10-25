import { StringSelectMenu, StringSelectMenuOption } from "commandkit";
import config from "@shared/config/config.json";

export default function rzejEmployeeRanksStringSelect(
  customId: string = "rank",
) {
  return (
    <StringSelectMenu required customId={customId} minValues={1} maxValues={1}>
      {Object.keys(config.ranks).map((e) => {
        return (
          <StringSelectMenuOption
            label={e}
            value={e}
            default={e === "Kandydat" ? true : false}
          />
        );
      })}
    </StringSelectMenu>
  );
}
