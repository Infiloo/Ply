import { fillTemplate } from "./format.js";

export function sanitizeChannelName(value, fallback = "ticket") {
  const name = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 95);
  return name || fallback;
}

export function renderTicketName(format, variables, fallbackFormat) {
  return sanitizeChannelName(
    fillTemplate(format || fallbackFormat || "ticket-{username}", variables),
    "ticket",
  );
}

export function renderAnswersName(format, variables, fallbackFormat) {
  return sanitizeChannelName(
    fillTemplate(format || fallbackFormat || "answers-{ticket}", variables),
    "answers",
  );
}
