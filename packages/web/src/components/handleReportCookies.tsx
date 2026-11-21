"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TokenHandler({
  token,
  number,
  type,
}: {
  number: string;
  token: string;
  type: "edit" | "preview";
}) {
  const router = useRouter();

  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    async function saveToken() {
      const params = new URLSearchParams({
        number,
        type,
      });

      const response = await fetch(
        `/api/site/shift/report/token-cookie?${params}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );

      if (response.ok) {
        router.replace(
          `/zmiana/${number}/raport/${type === "edit" ? "edytuj" : "podglad"}`,
        );
      } else {
        router.replace("/notfound");
      }
    }

    saveToken();
  }, [number, token, router, type]);

  return <div className="ml-5">Ładowanie...</div>;
}
