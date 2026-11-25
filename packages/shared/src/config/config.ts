export const sharedConfig = {
  timezone: "Europe/Warsaw",
  stations: {
    "Kierownik Zmiany": 0,

    // dwuosobowe u2

    "Operator ATC": 1,
    "Operator BOP": 2,

    // trzyosobowe u2
    // +
    "Operator MCC": 3,

    // dwuosobowe u1

    "U1 - ATC": 100,
    "U1 - BOP": 102,

    // trzyosobowe u1
    // +
    "U1 - MCC": 101,

    // pozostale

    "Operator TCR": 7,
    "Operator Polowy": 8,
    "Operator FWP": 9,
    "Operator EDG": 10,

    // u2 relikt
    "Kontrola Mocy": 1,
    "Kontrola Turbin (MCR)": 2,
    "Kontrola Chłodzenia": 4,
    "Kontrola Skraplacza": 5,
    "Kontrola Deaeratora": 6,
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
      color: null,
      prettyName: "Zwolnienie Dysyplinarne",
    },
    resignation: {
      color: null,
      prettyName: "Wypowiedzenie o porozumieniu stron",
    },
  } satisfies Record<string, { color: string | null; prettyName: string }>,
};

const station = (name: keyof typeof sharedConfig.stations) => ({
  name,
  order: (sharedConfig.stations as Record<string, number>)[name],
});

export const stationsGrouped = {
  U2_MCR: [
    station("Operator ATC"),
    station("Operator BOP"),
    station("Operator MCC"),
  ],
  U1_MCR: [station("U1 - ATC"), station("U1 - BOP"), station("U1 - MCC")],
  Inne: [
    station("Operator TCR"),
    station("Operator FWP"),
    station("Operator EDG"),
    station("Operator Polowy"),
  ],
  U2_MCR_5os: [
    station("Kontrola Mocy"),
    station("Kontrola Chłodzenia"),
    station("Kontrola Turbin (MCR)"),
    station("Kontrola Skraplacza"),
    station("Kontrola Deaeratora"),
  ],
};
