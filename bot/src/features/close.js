import { MessageFlags } from "discord.js";
import {
  buildCloseConfirm,
} from "../lib/components.js";
import {
  closeTicket,
  getConfig,
  getTicketById,
} from "../lib/db.js";
import { buildEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { canClose, resolveMember } from "../lib/permissions.js";
import { ticketVariables } from "../lib/placeholders.js";
import { untrackTicketChannel } from "../runtime.js";
import { effectiveMessage, effectiveTiming } from "@ply/shared";

const log = logger("close");

async function loadTicketContext(interaction, ticketId) {
  const ticket = getTicketById(ticketId);
  if (!ticket) return null;
  if (ticket.status === "closed") {
    return { error: "This ticket is already closed." };
  }
  if (!interaction.channel || interaction.channel.id !== ticket.channel_id) {
    return { error: "This button only works inside its ticket channel." };
  }
  const config = getConfig(ticket.guild_id);
  const type = config?.ticketTypes?.find((entry) => entry.id === ticket.type_id) || null;
  if (!config) return { error: "This server is no longer configured for Ply." };

  let member = interaction.member;
  if (!member?.roles?.cache?.size) {
    member = await resolveMember(interaction.guild, interaction.user.id);
  }
  if (!canClose(ticket, member, interaction.guild, config, type)) {
    return { error: "You are not allowed to close this ticket." };
  }
  return { ticket, config, type, member };
}

export async function handleCloseRequest(interaction, ticketId) {
  const context = await loadTicketContext(interaction, ticketId);
  if (!context || context.error) {
    await interaction.reply({
      content: context?.error || "This ticket no longer exists.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: "Close this ticket?",
    components: [buildCloseConfirm(context.config, ticketId)],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleCloseCancel(interaction) {
  await interaction.update({
    content: "Cancelled. The ticket stays open.",
    components: [],
  });
}

export async function handleCloseConfirm(interaction, ticketId) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const context = await loadTicketContext(interaction, ticketId);
  if (!context || context.error) {
    await interaction.editReply(
      context?.error || "This ticket no longer exists.",
    );
    return;
  }

  const { ticket, config, type, member } = context;
  const channel = interaction.channel;
  const owner = await interaction.client.users
    .fetch(ticket.owner_id)
    .catch(() => null);
  const variables = ticketVariables({
    guild: interaction.guild,
    config,
    type,
    ticket,
    channel,
    user: owner,
    member,
  });
  const embed = buildEmbed(
    config,
    effectiveMessage(config, type, "closed"),
    variables,
    { color: config.identity.dangerColor },
  );

  closeTicket(ticket.id);
  untrackTicketChannel(channel.id);

  if (ticket.support_message_id) {
    const supportChannel =
      type?.supportChannelId || config.defaults.supportChannelId;
    if (supportChannel) {
      const support = await interaction.guild.channels
        .fetch(supportChannel)
        .catch(() => null);
      if (support?.isTextBased?.()) {
        const supportMessage = await support.messages
          .fetch(ticket.support_message_id)
          .catch(() => null);
        if (supportMessage) {
          await supportMessage.edit({ components: [] }).catch(() => {});
        }
      }
    }
  }

  await channel.send({ embeds: [embed] }).catch((error) => {
    log.warn(`Could not send closed message for ${ticket.id}`, error);
  });

  if (config.behavior.deleteOnClose) {
    const closeDelay = effectiveTiming(config, type, "closeDelaySeconds");
    const delay = closeDelay * 1000;
    const timer = setTimeout(() => {
      channel.delete(`Ply ticket closed by ${interaction.user.tag}`).catch(() => {});
    }, delay);
    timer.unref?.();
    await interaction.editReply(
      delay > 0
        ? `Ticket closed. This channel will be deleted in ${closeDelay}s.`
        : "Ticket closed.",
    );
  } else {
    await interaction.editReply("Ticket closed.");
  }
}
