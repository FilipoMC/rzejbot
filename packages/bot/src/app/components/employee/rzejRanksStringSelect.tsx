import { StringSelectMenu, StringSelectMenuOption } from "commandkit";
import config from "@shared/config/config";
import { EmployeeRanks } from "@shared/types/api";

export default function rzejEmployeeRanksStringSelect(
  customId: string = "rank",
  def: EmployeeRanks = "Kandydat",
) {
  return (
    <StringSelectMenu required customId={customId} minValues={1} maxValues={1}>
      {Object.keys(config.ranks).map((e) => {
        return (
          <StringSelectMenuOption label={e} value={e} default={e === def} />
        );
      })}
    </StringSelectMenu>
  );
}
