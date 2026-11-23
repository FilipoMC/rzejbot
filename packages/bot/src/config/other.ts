const other = {
  shifts: {
    defaultShiftTime: "19:00",
    defaultBriefingDuration: 15,
    defaultShiftDuration: 90,
    absenceAllowedUntil: 10,
  },
};

export default other;

export const kvKeys = {
  botStatuses: {
    devlock: "devlock-status",
    dev: "dev-status",
    normal: "bot-status",
  },
  messages: {
    devlock: "devlock-message",
  },
  flags: {
    devlockActive: "devlock",
    abortSpamPing: "abort-spam-ping",
  },
  other: {
    activeShiftHostId: "active-shift-host",
    shiftPlanEventDescription: (number: string) =>
      `shift-event-desc:${number}` as const,
  },
} as const;
