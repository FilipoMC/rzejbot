import { AutocompleteMap, SubcommandMap } from "@/types/commands";
import zaplanuj, {
  scheduleShiftAutocompleteHandler as zaplanujAC,
} from "./src/zaplanuj";

const shiftSubcommands: SubcommandMap = {
  zaplanuj,
};

export default shiftSubcommands;

export const shiftAutocomplete: AutocompleteMap<string | undefined> = {
  zaplanuj: zaplanujAC,
};
