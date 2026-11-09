const other = {
  shifts: {
    defaultShiftTime: "19:00",
    defaultBriefingDuration: 15,
    defaultShiftDuration: 90,
    absenceAllowedUntil: 30,
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
    shiftActive: "is-active-shift",
    devlockActive: "devlock",
    abortSpamPing: "abort-spam-ping",
  },
};
