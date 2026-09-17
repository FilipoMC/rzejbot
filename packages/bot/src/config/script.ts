import images from "@/config/images.json";

export const websiteUrl = `http://${process.env.SERVER_IP}${process.env.SERVER_PORT ? `:${process.env.SERVER_PORT}` : ""}`;

export const websitePages = {
  shiftPlan: (number: string) =>
    `${websiteUrl}/zmiana/${number.replaceAll("/", "-")}/plan`,
};

export const shiftEventName = (number: string) => `Zmiana ${number}`;

export function getRandomImage(category: keyof typeof images) {
  const arr = images[category];
  if (!Array.isArray(arr)) {
    return null;
  }

  return arr[Math.floor(Math.random() * arr.length)];
}
