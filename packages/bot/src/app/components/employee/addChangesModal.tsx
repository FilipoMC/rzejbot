import {
  Label,
  Modal,
  OnModalKitSubmit,
  RadioGroup,
  RadioGroupOption,
  StringSelectMenu,
  StringSelectMenuOption,
  TextInput,
} from "commandkit";
import {
  ChatInputCommandInteraction,
  GuildMember,
  TextInputStyle,
} from "discord.js";
import rzejEmployeeRanksStringSelect from "./rzejRanksStringSelect";
import { otherRanks } from "@shared/config/ranks";
import { ApiHelper } from "@/helper/apiHelper";
import { ApiHelperReturnData } from "@/types/apiHelper";
import { OtherEmployeeRanks } from "@shared/types/api";

export const addChangesModal = (
  interaction: ChatInputCommandInteraction,
  employee: ApiHelperReturnData<typeof ApiHelper.employee.find>,
  handler: OnModalKitSubmit,
) => {
  if (!interaction.inCachedGuild()) {
    return null;
  }
  const target =
    interaction.options.getMember("uzytkownik") ??
    interaction.options.getUser("uzytkownik", true);
  return (
    <Modal
      customId={`empAddChangesModal-${target.id}`}
      title="Dodaj opinię do pracownika"
      onSubmit={handler}
      options={{ once: true }}
    >
      <Label label="Typ">
        <RadioGroup customId="type" required>
          <RadioGroupOption label="Plus" value="plus" />
          <RadioGroupOption label="Minus" value="minus" />
          <RadioGroupOption label="Pochwała" value="praise" />
          <RadioGroupOption label="Awans" value="promotion" />
          <RadioGroupOption label="Uwaga" value="warn" />
          <RadioGroupOption label="Nagana" value="strike" />
          <RadioGroupOption label="Zawieszenie" value="suspension" />
          <RadioGroupOption
            label="Wypowiedzenie Zmieniające (degradacja)"
            value="demotion"
          />
          <RadioGroupOption
            label="Zwolnienie Dyscylinarne"
            value="termination"
          />
        </RadioGroup>
      </Label>
      <Label label="Uzasadnienie">
        <TextInput
          customId="reason"
          style={TextInputStyle.Paragraph}
          maxLength={500}
          required
        />
      </Label>
      <Label label="Komentarz" description="Dodatkowa informacja do opinii">
        <TextInput
          customId="note"
          style={TextInputStyle.Paragraph}
          maxLength={250}
        />
      </Label>
      <Label
        label="Nowa Rola"
        description="Rola którą pracownik dostanie po wysłaniu opinii (domyślnie ta same którą ma aktualnie)"
      >
        {rzejEmployeeRanksStringSelect({
          defaultRank: employee.employeeChanges.data[0]!.newRole,
        })}
      </Label>
      <Label label="Komisje">
        <StringSelectMenu
          customId="committees"
          maxValues={Object.keys(otherRanks).length}
        >
          {Object.keys(otherRanks).map((r) => {
            return (
              <StringSelectMenuOption
                label={r}
                value={r.replaceAll(" ", "_")}
                default={employee.committees.includes(r as OtherEmployeeRanks)}
              />
            );
          })}
        </StringSelectMenu>
      </Label>
    </Modal>
  );
};
