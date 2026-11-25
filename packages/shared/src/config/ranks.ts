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
} satisfies Record<string, string>;

export const otherRanks = {
  "Główny Szkoleniowiec": "1468623711073472703",
  Szkoleniowiec: "1468623874546729197",
  "Szkoleniowiec Aplikujący": "1468623965781233847",
  "Przewodniczący Komisji Marketingowej": "1485716905833529376",
  "Członek Komisji Marketingowej": "1485717351788712106",
  // wynagrodzenia
  Kierownicze: "1487907334612189406",
  Wyższe: "1487907159416242286",
  Specjalistyczne: "1487907198595104958",
  Najniższe: "1487907201501892649",
  "Pracownik Miesiąca": "1520051877914611742",
  // stopnie I tytuły
  Profesor: "1537549060297334934",
  "Doktor Habilitowany": "1537549123777986671",
  Doktor: "1537549203922755654",
  // Dodatkowe
  "Wielce Zasłużony Działacz ŻEJ": "1570086344191901787",
  "Zasłużony Działacz ŻEJ": "1519423430343135385",
  "Medal Pamiątkowy PAA Za Zasługi dla Rozwoju Energetyki Atomowej":
    "1519423418871713977",
  "Złoty Medal Dyrektora ŻEJ Za Wybitne Osiągnięcia dla Energetyki Jądrowej":
    "1519423432859713690",
  "Złoty Medal Dyrektora ŻEJ Za Wybitne Osiągnięcia Naukowe":
    "1519423435409723505",
  "Medal Dyrektora ŻEJ Za Wkład w Rozwój Elektrowni": "1547664830910173257",
  "Odznaka Głównego Inżyniera ŻEJ Bezpieczny Rdzeń": "1525589130933964831",
} satisfies Record<string, string>;

export const allRanks = { ...mainRanks, ...otherRanks };
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
  Dodatkowe: {
    id: "1573700831667028080",
    ranks: [
      "Wielce Zasłużony Działacz ŻEJ",
      "Zasłużony Działacz ŻEJ",
      "Medal Pamiątkowy PAA Za Zasługi dla Rozwoju Energetyki Atomowej",
      "Złoty Medal Dyrektora ŻEJ Za Wybitne Osiągnięcia dla Energetyki Jądrowej",
      "Złoty Medal Dyrektora ŻEJ Za Wybitne Osiągnięcia Naukowe",
      "Medal Dyrektora ŻEJ Za Wkład w Rozwój Elektrowni",
      "Odznaka Głównego Inżyniera ŻEJ Bezpieczny Rdzeń",
    ],
  },
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
  "Stopnie Naukowe, Wynagrodzenie I inne": [
    { allowMultiChoice: false, value: "Stopnie I Tytuły" },
    { allowMultiChoice: true, value: "Wynagrodzenie" },
    { allowMultiChoice: true, value: "Dodatkowe" },
  ],
} satisfies Record<
  string,
  { allowMultiChoice: boolean; value: keyof typeof rankGroups }[]
>;

// TODO: Optimize via usage of role ids
export function getGroupsForRank(role: string) {
  if (!Object.keys(allRanks).includes(role)) {
    console.error("hit rock bottom in getgroupsforrank");
    return [];
  }

  const groupsIncludingRole = Object.entries(rankGroups).filter(([, v]) =>
    (v.ranks as string[]).includes(
      role.replaceAll(/[^a-zęóąśłżźćń0-9\s]/gi, "").trim(),
    ),
  );
  return groupsIncludingRole.map(([groups]) => {
    return {
      group: {
        name: groups,
        id: rankGroups[groups as keyof typeof rankGroups].id,
      },
      role: {
        name: role,
        id: allRanks[role as AllRanks],
      },
    };
  });
}

// TODO: implement
// export function manageEmployeeRoles(
//   employee: EmployeeAPIResponse,
//   newEmployee: EmployeeAPIResponse,
// ) {}

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

export const shortAcademicTitleNames = {
  Profesor: "prof.",
  "Doktor Habilitowany": "dr hab.",
  Doktor: "dr",
} satisfies Record<
  (typeof rankGroups)["Stopnie I Tytuły"]["ranks"][number],
  string
>;
