export const websiteUrl = `http://${process.env.SERVER_IP}${process.env.SERVER_PORT ? `:${process.env.SERVER_PORT}` : ""}`;

export const websitePages = {
  shiftPlan: (number: string) =>
    `${websiteUrl}/zmiana/${number.replaceAll("/", "-")}/plan`,
};
