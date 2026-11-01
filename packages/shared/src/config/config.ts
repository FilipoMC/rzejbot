export const sharedConfig = {
  timezone: "Europe/Warsaw",
  stations: {
    "Kierownik Zmiany": 0,
    "Kontrola Mocy": 1,
    "Kontrola Turbin (MCR)": 2,
    "Kontrola Turbin (TCR)": 3,
    "Kontrola Chłodzenia": 4,
    "Kontrola Skraplacza": 5,
    "Kontrola Deaeratora": 6,
    "Kontrola Temperatur Pomp Zasilających": 7,
    "Kontrola Generatorów Awaryjnych Diesla": 8,
    "Operator Polowy": 9,
    "Nadzór nad Blokiem I.": 10,
  } satisfies Record<string, number>,
  changeType: {
    plus: { color: "#d5ecff", prettyName: "Plus" },
    minus: { color: "#ffb1b1", prettyName: "Minus" },
    praise: { color: "#a8d8ff", prettyName: "Pochwała" },
    promotion: { color: null, prettyName: "Awans" },
    warn: { color: "#ff7474", prettyName: "Uwaga" },
    strike: { color: "#ff2929", prettyName: "Nagana" },
    suspension: { color: null, prettyName: "Zawieszenie" },
    demotion: { color: null, prettyName: "Wypowiedzenie Zmieniające" },
    termination: {
      color: "#ffffff",
      prettyName: "Zwolnienie Dysyplinarne",
    },
  } satisfies Record<string, { color: string | null; prettyName: string }>,
};

const station = (name: keyof typeof sharedConfig.stations) => ({
  name,
  order: (sharedConfig.stations as Record<string, number>)[name],
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
