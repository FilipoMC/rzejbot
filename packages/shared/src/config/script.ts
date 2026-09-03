import config from "./config.json";

export const stationsGrouped = {
  u2_mcr: [
    config.stations["Kontrola Mocy"],
    config.stations["Kontrola Chłodzenia"],
    config.stations["Kontrola Turbin (TCR)"],
    config.stations["Kontrola Skraplacza"],
    config.stations["Kontrola Deaeratora"],
  ],
  other: [
    config.stations["Kontrola Turbin (TCR)"],
    config.stations["Kontrola Temperatur Pomp Zasilających"],
    config.stations["Kontrola Generatorów Awaryjnych Diesla"],
    config.stations["Operator Polowy"],
    config.stations["Nadzór nad Blokiem I."],
  ],
};
