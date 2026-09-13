import React from "react";

const styles = {
  "**": "bold",
  __: "underline",
};

export default function RichText({ children }: { children: string }) {
  return <>{parse(children)}</>;
}

function parse(text: string) {
  const result = [];
  let i = 0;
  let plain = "";

  const flush = () => {
    if (plain) {
      result.push(plain);
      plain = "";
    }
  };

  while (i < text.length) {
    const marker = text.slice(i, i + 2);

    if ((styles as Record<string, string>)[marker]) {
      const end = findClosing(text, marker, i + 2);

      if (end !== -1) {
        flush();

        const inner = text.slice(i + 2, end);

        result.push(
          marker === "**" ?
            <strong key={i}>{parse(inner)}</strong>
          : <u key={i}>{parse(inner)}</u>,
        );

        i = end + 2;
        continue;
      }
    }

    plain += text[i];
    i++;
  }

  flush();
  return result;
}

function findClosing(text: string, marker: string, start: number) {
  return text.indexOf(marker, start);
}
