import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { parseEmoji } from "./format.js";

export function panelMode(config, types) {
  if (config.panel.style === "select") return "select";
  if (config.panel.style === "buttons") {
    return types.length <= 5 ? "buttons" : "select";
  }
  return types.length === 1 ? "buttons" : "select";
}

export function buildPanelComponents(config, types) {
  if (!types.length) return [];
  const mode = panelMode(config, types);

  if (mode === "buttons") {
    const row = new ActionRowBuilder();
    for (const type of types.slice(0, 5)) {
      const button = new ButtonBuilder()
        .setCustomId(`ply:type:${type.id}`)
        .setLabel(type.name.slice(0, 80))
        .setStyle(types.length === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);
      const emoji = parseEmoji(type.emoji);
      if (emoji) button.setEmoji(emoji);
      row.addComponents(button);
    }
    return [row];
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ply:open:select")
    .setPlaceholder(config.labels.selectPlaceholder.slice(0, 100))
    .setMinValues(1)
    .setMaxValues(1);
  for (const type of types.slice(0, 25)) {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(type.name.slice(0, 100))
      .setValue(type.id)
      .setDescription((type.description || "Open a ticket").slice(0, 100));
    const emoji = parseEmoji(type.emoji);
    if (emoji) option.setEmoji(emoji);
    menu.addOptions(option);
  }
  return [new ActionRowBuilder().addComponents(menu)];
}

export function buildCloseButton(config, ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ply:close:${ticketId}`)
      .setLabel(config.labels.close.slice(0, 80))
      .setStyle(ButtonStyle.Danger),
  );
}

export function buildCloseConfirm(config, ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ply:close-confirm:${ticketId}`)
      .setLabel(config.labels.confirmClose.slice(0, 80))
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ply:close-cancel:${ticketId}`)
      .setLabel(config.labels.cancel.slice(0, 80))
      .setStyle(ButtonStyle.Secondary),
  );
}

export function buildClaimButton(config, ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ply:claim:${ticketId}`)
      .setLabel(config.labels.claim.slice(0, 80))
      .setStyle(ButtonStyle.Success),
  );
}

export function buildClaimedButton(config) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ply:claim:done")
      .setLabel(config.labels.claimed.slice(0, 80))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );
}

export function buildSubmitRow(config, ticketId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ply:submit:${ticketId}`)
      .setLabel(config.labels.send.slice(0, 80))
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`ply:close:${ticketId}`)
      .setLabel(config.labels.close.slice(0, 80))
      .setStyle(ButtonStyle.Secondary),
  );
}

export function buildPublishRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ply:panel:publish")
      .setLabel("Publish panel")
      .setStyle(ButtonStyle.Primary),
  );
}
