export * from "./defaults.js";
export * from "./normalize.js";
export * from "./wire.js";
export * from "./codec.js";

export const APP_NAME = "Ply";
export const APP_SLOGAN = "Just apply, but customized.";
export const APP_TAGLINE = "Ply — Just apply, but customized.";

export const PLACEHOLDERS = [
  "{user}",
  "{username}",
  "{userId}",
  "{userAvatar}",
  "{type}",
  "{ticket}",
  "{ticketName}",
  "{staff}",
  "{staffName}",
  "{number}",
  "{total}",
  "{question}",
  "{answers}",
  "{answersName}",
  "{claimLabel}",
  "{sendLabel}",
  "{guild}",
  "{botName}",
  "{date}",
  "{time}",
];

export const CHANNEL_TYPES = new Set([
  "text",
  "announcement",
  "forum",
  "media",
]);

export function channelTypeName(type) {
  const map = {
    0: "text",
    2: "voice",
    4: "category",
    5: "announcement",
    13: "stage",
    15: "forum",
    16: "media",
  };
  return map[type] || String(type);
}
