import config from "./config.json";

const station = (name: keyof typeof config.stations) => ({
  name,
  order: (config.stations as Record<string, number>)[name],
});

export const stationsGrouped = {
  U2_MCR: [
    station("Kontrola Mocy"),
    station("Kontrola Chłodzenia"),
    station("Kontrola Turbin (MCR)"),
    station("Kontrola Skraplacza"),
    station("Kontrola Deaeratora"),
  ],
  Inne: [
    station("Kontrola Turbin (TCR)"),
    station("Kontrola Temperatur Pomp Zasilających"),
    station("Kontrola Generatorów Awaryjnych Diesla"),
    station("Operator Polowy"),
    station("Nadzór nad Blokiem I."),
  ],
};

export const ranksOrder = Object.keys(config.ranks).reduce(
  (prev, v, idx) => prev.set(v, idx),
  new Map<string, number>(),
);

export const shortRankNames = new Map(
  Object.entries({
    "Dyrektor Elektrowni": "Dyr. El.",
    "Zastępca Dyrektora Elektrowni": "Zast. Dyr. Elek.",
    "Główny Inżynier": "Gł. Inż.",
    "p.o Głównego Inżyniera": "p.o. Gł. Inż.",
    "Kierownik Bloków": "Kier. Bl.",
    "Starszy Inżynier Reaktora": "St. Inż.",
    "Inżynier Reaktora": "Inż. Reak.",
    "Operator Reaktora": "Op. Reak.",
    "Starszy Operator Niejądrowy": "St. Op. Niejądr.",
    "Operator Niejądrowy Reaktora": "Op. Niejądr.",
    Kandydat: "Kand.",
  } satisfies Record<keyof typeof config.ranks, string>),
);
