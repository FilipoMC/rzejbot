import {
  Modal,
  Label,
  UserSelectMenu,
  TextInput,
  CheckboxGroup,
  CheckboxGroupOption,
  OnModalKitSubmit,
} from "commandkit";
import {
  ChatInputCommandInteraction,
  GuildMember,
  TextInputStyle,
} from "discord.js";
import { ApiHelperReturnData } from "@/types/apiHelper";
import { getRobloxUsersByIds } from "@/utils/api";
import RzejEmployeeRanksStringSelect from "./rzejRanksStringSelect";
import { ApiHelper } from "@/helper/apiHelper";

export function employeeAddModal(
  interaction: ChatInputCommandInteraction,
  handler: OnModalKitSubmit,
) {
  return (
    <Modal
      title="Dodaj Pracownika"
      options={{ once: false }}
      onSubmit={handler}
      customId={`modalEmployeeAdd-${interaction.options.getUser("uzytkownik", true).id}`}
    >
      <Label label="Użytkownik">
        <UserSelectMenu
          required
          customId="user"
          defaultValues={interaction.options.getUser("uzytkownik", true).id}
          maxValues={1}
          minValues={1}
        />
      </Label>
      <Label label="Imię IC dla pracownika">
        <TextInput
          customId="nameIC"
          style={TextInputStyle.Short}
          placeholder="Oliwier Baran"
          value={
            (interaction.options.getMember("uzytkownik") as GuildMember)
              ?.displayName ?? ""
          }
          required
        />
      </Label>
      <Label label="Roblox Username" description="Nie display name">
        <TextInput
          customId="robloxName"
          style={TextInputStyle.Short}
          placeholder="Pawe_320"
          required
        />
      </Label>
      <Label
        label="Ranga"
        description="Ranga którą nadać pracownikowi na start"
      >
        {RzejEmployeeRanksStringSelect({})}
      </Label>
      <Label label="Kwalifikacje/Uprawnienia">
        <CheckboxGroup customId="qualification">
          <CheckboxGroupOption label="Pracownik" value="pracownik" />
          <CheckboxGroupOption label="Jądrowy" value="jadrowy" />
          <CheckboxGroupOption
            label="Kierownik Zmiany"
            value="kierownikZmiany"
          />
          <CheckboxGroupOption label="Szkoleniowiec" value="szkoleniowiec" />
        </CheckboxGroup>
      </Label>
    </Modal>
  );
}

export async function employeeEditModal(
  handler: OnModalKitSubmit,
  employee: ApiHelperReturnData<typeof ApiHelper.employee.find>,
) {
  return (
    <Modal
      title="Edytuj Pracownika"
      options={{ once: false }}
      onSubmit={handler}
      customId={`modalEmployeeAdd-${employee.discordId}`}
    >
      <Label label="Użytkownik">
        <UserSelectMenu
          required
          customId="user"
          defaultValues={employee.discordId}
          maxValues={1}
          minValues={1}
        />
      </Label>
      <Label label="Imię IC dla pracownika">
        <TextInput
          customId="nameIC"
          style={TextInputStyle.Short}
          placeholder="Oliwier Baran"
          required
          value={employee.nameIC}
        />
      </Label>
      <Label label="Roblox Username" description="Nie display name">
        <TextInput
          customId="robloxName"
          style={TextInputStyle.Short}
          placeholder="Pawe_320"
          required
          value={
            (await getRobloxUsersByIds([employee.robloxId]))?.[0]?.name || ""
          }
        />
      </Label>
      <Label label="Kwalifikacje/Uprawnienia">
        <CheckboxGroup customId="qualification">
          <CheckboxGroupOption
            label="Pracownik"
            value="pracownik"
            default={employee.qualification.pracownik}
          />
          <CheckboxGroupOption
            label="Jądrowy"
            value="jadrowy"
            default={employee.qualification.jadrowy}
          />
          <CheckboxGroupOption
            label="Kierownik Zmiany"
            value="kierownikZmiany"
            default={employee.qualification.kierownikZmiany}
          />
          <CheckboxGroupOption
            label="Szkoleniowiec"
            value="szkoleniowiec"
            default={employee.qualification.szkoleniowiec}
          />
        </CheckboxGroup>
      </Label>
    </Modal>
  );
}
