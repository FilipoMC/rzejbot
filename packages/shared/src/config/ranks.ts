import { AllRanks } from "../types/other";

export const mainRanks = {
  // main server rankId's
  // "Dyrektor Elektrowni": "1450930280037617787",
  // "Zastępca Dyrektora Elektrowni": "1467529036858130514",
  // "Główny Inżynier": "1450931343444672542",

  // "Kierownik Bloków": "1450931356833157301",
  // "p.o. Kierownika Bloków": "1566526211063287858",

  // "Starszy Inżynier Reaktora": "1450931358921789440",
  // "Inżynier Reaktora": "1450939750684033064",
  // "Operator Reaktora": "1450939912894414909",

  // "Starszy Operator Niejądrowy": "1450939914882646228",
  // "Operator Niejądrowy": "1450939916677812406",

  //test server ranks
  "Dyrektor Elektrowni": "1566523889058582589",
  "Zastępca Dyrektora Elektrowni": "1566524390965780650",
  "Główny Inżynier Elektrowni": "1566524507064373399",

  "Kierownik Bloków": "1566526082994413748",
  "p.o. Kierownika Bloków": "1566526211063287858",

  "Starszy Inżynier Reaktora": "1566528343912882357",
  "Inżynier Reaktora": "1566528989852344410",
  "Operator Reaktora": "1566529033838002348",

  "Starszy Operator Niejądrowy": "1566529089764987032",
  "Operator Niejądrowy": "1566529174787723424",
} satisfies Record<string, string>;

export const otherRanks = {
  // test server ranks
  "Główny Szkoleniowiec": "1566529797025169478",
  Szkoleniowiec: "1566529799680168116",
  "Szkoleniowiec Aplikujący": "1566529800783401010",
  "Przewodniczący Komisji Marketingowej": "1566530230321938452",
  "Członek Komisji Marketingowej": "1566530180158062773",
  // Wynagrodzenia
  Kierownicze: "1573485324280270909",
  Wyższe: "1573485325949599825",
  Specjalistyczne: "1573485328113598514",
  Najniższe: "1573485329539932312",
  "Pracownik Miesiąca": "1573485449886957678",
  // Stopnie I Tytuły
  Profesor: "1573485560499142766",
  "Doktor Habilitowany": "1573485564009648199",
  Doktor: "1573485566392139776",
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
  //main
  // "Kierownictwo Elektrowni": {
  //   id: "1462522587878789265",
  //   ranks: [
  //     "Dyrektor Elektrowni",
  //     "Zastępca Dyrektora Elektrowni",
  //     "Główny Inżynier Elektrowni",
  //   ],
  // },
  // "Kierownictwo Bloków": {
  //   id: "1450931355885240341",
  //   ranks: ["Kierownik Bloków", "p.o. Kierownika Bloków"],
  // },
  // "Personel Elektrowni": {
  //   id: "1451206749578330142",
  //   ranks: [
  //     "Starszy Inżynier Reaktora",
  //     "Inżynier Reaktora",
  //     "Operator Reaktora",
  //     "Starszy Operator Niejądrowy",
  //     "Operator Niejądrowy",
  //   ],
  // },
  // "I. Zmiana Elektrowni": {
  //   id: "1450931358217277470",
  //   ranks: [
  //     "Starszy Inżynier Reaktora",
  //     "Inżynier Reaktora",
  //     "Operator Reaktora",
  //     "Starszy Operator Niejądrowy",
  //     "Operator Niejądrowy",
  //   ],
  // },
  // "Kadra Szkoleniowa": {
  //   id: "1468621630438772791",
  //   ranks: [
  //     "Główny Szkoleniowiec",
  //     "Szkoleniowiec",
  //     "Szkoleniowiec Aplikujący",
  //   ],
  // },
  // Komisje: {
  //   id: "1468618072536645759",
  //   ranks: [
  //     "Przewodniczący Komisji Marketingowej",
  //     "Członek Komisji Marketingowej",
  //   ],
  // },

  // test
  "Kierownictwo Elektrowni": {
    id: "1566523773195260154",
    ranks: [
      "Dyrektor Elektrowni",
      "Zastępca Dyrektora Elektrowni",
      "Główny Inżynier Elektrowni",
    ],
  },
  "Kierownictwo Bloków": {
    id: "1566523847908397096",
    ranks: ["Kierownik Bloków", "p.o. Kierownika Bloków"],
  },
  "Personel Elektrowni": {
    id: "1566530072070852798",
    ranks: [
      "Starszy Inżynier Reaktora",
      "Inżynier Reaktora",
      "Operator Reaktora",
      "Starszy Operator Niejądrowy",
      "Operator Niejądrowy",
    ],
  },
  "I. Zmiana Elektrowni": {
    id: "1566526310476550376",
    ranks: [
      "Starszy Inżynier Reaktora",
      "Inżynier Reaktora",
      "Operator Reaktora",
      "Starszy Operator Niejądrowy",
      "Operator Niejądrowy",
    ],
  },
  "Kadra Szkoleniowa": {
    id: "1566529719913156810",
    ranks: [
      "Główny Szkoleniowiec",
      "Szkoleniowiec",
      "Szkoleniowiec Aplikujący",
    ],
  },
  Komisje: {
    id: "1566530152517865503",
    ranks: [
      "Przewodniczący Komisji Marketingowej",
      "Członek Komisji Marketingowej",
    ],
  },
  Wynagrodzenie: {
    id: "1573485228905857146",
    ranks: [
      "Kierownicze",
      "Wyższe",
      "Specjalistyczne",
      "Najniższe",
      "Pracownik Miesiąca",
    ],
  },
  "Stopnie I Tytuły": {
    id: "1573485492643823626",
    ranks: ["Profesor", "Doktor Habilitowany", "Doktor"],
  },
  // TODO: dodac medale, wynagrodzenie?, stopnie i tytuly?, dodatkowe role?
} satisfies Record<
  string,
  {
    id: string;
    ranks: (keyof typeof allRanks)[];
  }
>;

export const committeesGrouped = {
  "Kadra Szkoleniowa & KM": [
    { allowMultiChoice: false, value: "Kadra Szkoleniowa" },
    { allowMultiChoice: false, value: "Komisje" },
  ],
  "Stopnie Naukowe & Wynagrodzenie": [
    { allowMultiChoice: true, value: "Stopnie I Tytuły" },
    { allowMultiChoice: true, value: "Wynagrodzenie" },
  ],
} satisfies Record<
  string,
  { allowMultiChoice: boolean; value: keyof typeof rankGroups }[]
>;

// TODO: Optimize via usage of role ids
export function getGroupsForRank(role: string) {
  if (!Object.keys(allRanks).includes(role)) {
    return [];
  }

  const groupsIncludingRole = Object.entries(rankGroups).filter(([, v]) =>
    (v.ranks as string[]).includes(
      role.replaceAll(/[^a-zA-Z0-9 ]/g, "").trim(),
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
  | "Operator Niejądrowy";

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
  } satisfies Pick<Record<AllRanks, string>, ShortRankNameKeys>),
);
