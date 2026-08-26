"use client";

const GIF006 = [
  "https://cdn.discordapp.com/attachments/1461796259613507614/1536067105542377562/togif.gif?ex=6a9076f8&is=6a8f2578&hm=1d2b86ab6c1af7f3f1deb14e6b8dbc47050c310909992a65dd351d615db45086&",
  "https://cdn.discordapp.com/attachments/1461796259613507614/1536067286505492512/togif.gif?ex=6a907723&is=6a8f25a3&hm=0a86676a728ad6eb7bd26ce6d0552f96d62c543323cb202b5de0ff257ace3f73&",
  "https://cdn.discordapp.com/attachments/1461796259613507614/1536066972817690634/togif.gif?ex=6a9076d9&is=6a8f2559&hm=561416df2be3cc6bf11c1982ec18fecf21a29d3d0c445867cbed02d7da68eebf&",
];

export default function Zmiana006NieIstnieje() {
  return <img src={GIF006[Math.floor(Math.random() * 3)]} />;
}
