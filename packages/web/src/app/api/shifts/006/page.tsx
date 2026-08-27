"use client";

import { useState } from "react";

const GIF006 = [
  "https://files.catbox.moe/tycsyl.gif",
  "https://files.catbox.moe/3zmlw1.gif",
  "https://files.catbox.moe/j74995.gif",
];

export default function Zmiana006NieIstnieje() {
  // eslint-disable-next-line
  const [random] = useState<number>(Math.floor(Math.random() * 3));

  // eslint-disable-next-line
  return <img src={GIF006[random]} />;
}
