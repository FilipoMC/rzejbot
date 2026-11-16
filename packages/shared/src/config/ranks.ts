import { AllRanks } from "../types/other";

export const mainRanks = {
  "Dyrektor Elektrowni": "1450930280037617787",
  "Zastępca Dyrektora Elektrowni": "1467529036858130514",
  "Główny Inżynier Elektrowni": "1450931343444672542",

  "Kierownik Bloków": "1450931356833157301",
  "p.o. Kierownika Bloków": "1566526211063287858",

  "Starszy Inżynier Reaktora": "1450931358921789440",
  "Inżynier Reaktora": "1450939750684033064",
  "Operator Reaktora": "1450939912894414909",

  "Starszy Operator Niejądrowy": "1450939914882646228",
  "Operator Niejądrowy": "1450939916677812406",
  Kandydat: "1450942654660739183",
} satisfies Record<string, string>;

export const otherRanks = {
  "Główny Szkoleniowiec": "1468623711073472703",
  Szkoleniowiec: "1468623874546729197",
  "Szkoleniowiec Aplikujący": "1468623965781233847",
  "Przewodniczący Komisji Marketingowej": "1485716905833529376",
  "Członek Komisji Marketingowej": "1485717351788712106",
} satisfies Record<string, string>;

export const allRanks = Object.assign(mainRanks, otherRanks);
/**
 * @what_is_odpierdalating_here
 * Maps organizational power plants groups and committees to their
 * respective Discord role IDs and associated rank titles.
 *
 * Each group entry contains:
 * - `id`: An array of associated Discord role IDs for the group/department.
 * - `ranks`: Either an array of keys referencing `mainRanks` or a sub-dictionary
 *   mapping custom rank titles to their specific Discord role IDs.
 */
export const rankGroups = {
  "Kierownictwo Elektrowni": {
    id: "1462522587878789265",
    ranks: [
      "Dyrektor Elektrowni",
      "Zastępca Dyrektora Elektrowni",
      "Główny Inżynier Elektrowni",
    ],
  },
  "Kierownictwo Bloków": {
    id: "1450931355885240341",
    ranks: ["Kierownik Bloków", "p.o. Kierownika Bloków"],
  },
  "Personel Elektrowni": {
    id: "1451206749578330142",
    ranks: [
      "Starszy Inżynier Reaktora",
      "Inżynier Reaktora",
      "Operator Reaktora",
      "Starszy Operator Niejądrowy",
      "Operator Niejądrowy",
    ],
  },
  "I. Zmiana Elektrowni": {
    id: "1450931358217277470",
    ranks: [
      "Starszy Inżynier Reaktora",
      "Inżynier Reaktora",
      "Operator Reaktora",
      "Starszy Operator Niejądrowy",
      "Operator Niejądrowy",
    ],
  },
  "Kadra Szkoleniowa": {
    id: "1468621630438772791",
    ranks: [
      "Główny Szkoleniowiec",
      "Szkoleniowiec",
      "Szkoleniowiec Aplikujący",
    ],
  },
  Komisje: {
    id: "1468618072536645759",
    ranks: [
      "Przewodniczący Komisji Marketingowej",
      "Członek Komisji Marketingowej",
    ],
  },
  // TODO: dodac medale, wynagrodzenie?, stopnie i tytuly?, dodatkowe role?
} satisfies Record<
  string,
  {
    id: string;
    ranks: (keyof typeof allRanks)[];
  }
>;

// TODO: Optimize via usage of role ids
export function getGroupsForRank(role: string) {
  if (!Object.keys(allRanks).includes(role)) {
    return [];
  }

  const groupsIncludingRole = Object.entries(rankGroups).filter(([, v]) =>
    (v.ranks as string[]).includes(
      role.replaceAll("=", "").replaceAll("・", "").trim(),
    ),
  );
  return groupsIncludingRole.map(([k]) => {
    return {
      group: {
        name: k,
        id: rankGroups[k as keyof typeof rankGroups].id,
      },
      role: {
        name: role,
        id: allRanks[role as AllRanks],
      },
    };
  });
}

export const ranksOrder = Object.keys(mainRanks).reduce(
  (prev, v, idx) => prev.set(v, idx),
  new Map<string, number>(),
);

type ShortRankNameKeys =
  | "Dyrektor Elektrowni"
  | "Zastępca Dyrektora Elektrowni"
  | "Główny Inżynier Elektrowni"
  | "Kierownik Bloków"
  | "p.o. Kierownika Bloków"
  | "Starszy Inżynier Reaktora"
  | "Inżynier Reaktora"
  | "Operator Reaktora"
  | "Starszy Operator Niejądrowy"
  | "Operator Niejądrowy"
  | "Kandydat";

export const shortRankNames = new Map(
  Object.entries({
    "Dyrektor Elektrowni": "Dyr. El.",
    "Zastępca Dyrektora Elektrowni": "Zast. Dyr. Elek.",
    "Główny Inżynier Elektrowni": "Gł. Inż.",
    "Kierownik Bloków": "Kier. Bl.",
    "p.o. Kierownika Bloków": "p.o. Kier. Bl.",
    "Starszy Inżynier Reaktora": "St. Inż.",
    "Inżynier Reaktora": "Inż. Reak.",
    "Operator Reaktora": "Op. Reak.",
    "Starszy Operator Niejądrowy": "St. Op. Niejądr.",
    "Operator Niejądrowy": "Op. Niejądr.",
    Kandydat: "Kand.",
  } satisfies Pick<Record<AllRanks, string>, ShortRankNameKeys>),
);
