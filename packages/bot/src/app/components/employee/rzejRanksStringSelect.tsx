import { StringSelectMenu, StringSelectMenuOption } from "commandkit";
import { EmployeeRanks } from "@shared/types/api";
import { mainRanks } from "@shared/config/ranks";

export default function rzejEmployeeRanksStringSelect(
  customId: string = "rank",
  def: EmployeeRanks = "Kandydat",
) {
  return (
    <StringSelectMenu required customId={customId} minValues={1} maxValues={1}>
      {Object.keys(mainRanks).map((e) => {
        return (
          <StringSelectMenuOption label={e} value={e} default={e === def} />
        );
      })}
    </StringSelectMenu>
  );
}
