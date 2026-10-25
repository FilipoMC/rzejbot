import {
  Modal,
  Label,
  UserSelectMenu,
  TextInput,
  StringSelectMenu,
  StringSelectMenuOption,
  CheckboxGroup,
  CheckboxGroupOption,
  OnModalKitSubmit,
} from "commandkit";
import { ChatInputCommandInteraction, TextInputStyle } from "discord.js";
import config from "@shared/config/config";
import { ApiHelperReturnType } from "@/types/apiHelper";
import { EmployeeAPIResponse } from "@shared/types/api";
import { getRobloxUsersByIds } from "@/utils/api";
import rzejEmployeeRanksStringSelect from "./rzejRanksStringSelect";

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
        {rzejEmployeeRanksStringSelect()}
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
  employee: ApiHelperReturnType<EmployeeAPIResponse>,
) {
  if (employee.status !== "ok") {
    return;
  }
  return (
    <Modal
      title="Dodaj Pracownika"
      options={{ once: false }}
      onSubmit={handler}
      customId={`modalEmployeeAdd-${employee.data.discordId}`}
    >
      <Label label="Użytkownik">
        <UserSelectMenu
          required
          customId="user"
          defaultValues={employee.data.discordId}
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
          value={employee.data.nameIC}
        />
      </Label>
      <Label label="Roblox Username" description="Nie display name">
        <TextInput
          customId="robloxName"
          style={TextInputStyle.Short}
          placeholder="Pawe_320"
          required
          value={
            (await getRobloxUsersByIds([employee.data.robloxId]))?.[0]?.name ||
            ""
          }
        />
      </Label>
      <Label
        label="Ranga"
        description="Ranga którą nadać pracownikowi na start"
      >
        <StringSelectMenu required customId="rank" minValues={1} maxValues={1}>
          {Object.keys(config.ranks).map((e) => {
            return (
              <StringSelectMenuOption
                label={e}
                value={e}
                default={e === employee.data.rank ? true : false}
              />
            );
          })}
        </StringSelectMenu>
      </Label>
      <Label label="Kwalifikacje/Uprawnienia">
        <CheckboxGroup customId="qualification">
          <CheckboxGroupOption
            label="Pracownik"
            value="pracownik"
            default={employee.data.qualification.pracownik}
          />
          <CheckboxGroupOption
            label="Jądrowy"
            value="jadrowy"
            default={employee.data.qualification.jadrowy}
          />
          <CheckboxGroupOption
            label="Kierownik Zmiany"
            value="kierownikZmiany"
            default={employee.data.qualification.kierownikZmiany}
          />
          <CheckboxGroupOption
            label="Szkoleniowiec"
            value="szkoleniowiec"
            default={employee.data.qualification.szkoleniowiec}
          />
        </CheckboxGroup>
      </Label>
    </Modal>
  );
}
