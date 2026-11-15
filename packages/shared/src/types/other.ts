import { allRanks } from "../config/ranks";

// export type AllRanks =
//   | {
//       [K in keyof typeof ranksGrouped]: (typeof ranksGrouped)[K]["ranks"] extends (
//         readonly string[]
//       ) ?
//         (typeof ranksGrouped)[K]["ranks"][number]
//       : keyof (typeof ranksGrouped)[K]["ranks"];
//     }[keyof typeof ranksGrouped]
//   | keyof typeof mainRanks;

export type AllRanks = keyof typeof allRanks;
