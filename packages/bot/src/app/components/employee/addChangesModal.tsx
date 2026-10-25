import {
  Label,
  Modal,
  OnModalKitSubmit,
  RadioGroup,
  RadioGroupOption,
  TextInput,
  UserSelectMenu,
} from "commandkit";
import {
  ChatInputCommandInteraction,
  GuildMember,
  TextInputStyle,
} from "discord.js";
import emoji from "@/config/emoji";
import rzejEmployeeRanksStringSelect from "./rzejRanksStringSelect";
export const addChangesModal = (
  interaction: ChatInputCommandInteraction,
  handler: OnModalKitSubmit,
) => {
  if (!interaction.inCachedGuild()) {
    return null;
  }
  const target =
    interaction.options.getMember("uzytkownik") ??
    interaction.options.getUser("uzytkownik", true);
  const isTargetInGuild = target instanceof GuildMember;
  return (
    <Modal
      customId="empAddChangesModal"
      title="Dodaj opinię do pracownika"
      onSubmit={handler}
      options={{ once: true }}
    >
      <Label
        label="Użytkownik"
        description={
          isTargetInGuild ? undefined : (
            emoji.warningUnicode +
            " Nie znaleziono użytkownika w serwerze Discord"
          )
        }
      >
        <UserSelectMenu customId="user" required defaultValues={[target.id]} />
      </Label>
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
        {rzejEmployeeRanksStringSelect()}
      </Label>
    </Modal>
  );
};
