import { EmbedBuilder } from "discord.js";

export function fillTemplate(value, variables) {
  if (typeof value !== "string" || !value) return "";
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) =>
    variables[key] === undefined || variables[key] === null
      ? ""
      : String(variables[key]),
  );
}

export function oneLine(value, max = 256) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function clip(value, max) {
  const string = String(value || "");
  return string.length > max ? `${string.slice(0, Math.max(0, max - 1))}…` : string;
}

export function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value || "").trim());
}

export function parseColor(value, fallback = "#7C5CFC") {
  const string = String(value || "").trim();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(string)) return fallback;
  return string;
}

export function parseEmoji(value) {
  const string = String(value || "").trim();
  if (!string) return undefined;
  const custom = string.match(/^<(a?):([a-zA-Z0-9_]{1,32}):(\d{15,25})>$/);
  if (custom) {
    return {
      animated: custom[1] === "a",
      name: custom[2],
      id: custom[3],
    };
  }
  return string.length <= 64 ? string : undefined;
}

export function buildEmbed(config, message, variables, options = {}) {
  const title = fillTemplate(message?.title, variables).trim();
  const description = fillTemplate(message?.description, variables).trim();
  const footer = fillTemplate(
    message?.footerText || config.identity.footerText,
    variables,
  ).trim();
  const image = fillTemplate(message?.imageUrl || options.assetUrl, variables).trim();
  const thumbnail = fillTemplate(message?.thumbnailUrl, variables).trim();
  const color = parseColor(
    message?.color || options.color || config.identity.accentColor,
    config.identity.accentColor,
  );

  const embed = new EmbedBuilder().setColor(color);
  if (title) embed.setTitle(oneLine(title, 256));
  if (description) embed.setDescription(clip(description, 4096));
  if (footer) embed.setFooter({ text: oneLine(footer, 2048) });
  if (isHttpUrl(image)) embed.setImage(image);
  if (isHttpUrl(thumbnail)) embed.setThumbnail(thumbnail);
  return embed;
}

export function buildPanelEmbed(config, variables) {
  return buildEmbed(
    config,
    {
      ...config.panel,
      footerText: config.panel.footerText || config.identity.footerText,
    },
    variables,
  );
}

export function buildSummaryEmbed(config, message, variables, answers) {
  const embed = buildEmbed(config, message, variables);
  const baseCost =
    (embed.data.title?.length || 0) +
    (embed.data.description?.length || 0) +
    (embed.data.footer?.text?.length || 0);
  let budget = Math.max(0, 5800 - baseCost);
  let count = 0;

  for (const answer of answers) {
    if (count >= 25 || budget < 40) break;
    count += 1;
    const name = clip(answer.label || `Question ${count}`, 256);
    const maxValue = Math.min(1024, Math.max(24, budget - name.length - 8));
    const value = clip(answer.skipped ? "*Skipped*" : answer.answer || "—", maxValue);
    budget -= name.length + value.length;
    embed.addFields({ name, value, inline: false });
  }

  return embed;
}
