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
