import {
  buildClaimedButton,
  buildCloseButton,
} from "../lib/components.js";
import {
  claimTicket,
  getConfig,
  getTicketById,
} from "../lib/db.js";
import { buildEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { isStaff, resolveMember } from "../lib/permissions.js";
import { ticketVariables } from "../lib/placeholders.js";
import { grantTicketAccess } from "./ticketAccess.js";
import { effectiveAsset, effectiveMessage, effectiveTiming } from "@ply/shared";

const log = logger("claim");

export async function handleClaim(interaction, ticketId) {
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    await interaction.editReply("This ticket no longer exists.");
    return;
  }
  if (ticket.claimed_by) {
    await interaction.editReply("This ticket has already been claimed.");
    return;
  }

  const config = getConfig(ticket.guild_id);
  const type = config?.ticketTypes?.find((entry) => entry.id === ticket.type_id) || null;
  if (!config) {
    await interaction.editReply("This server is no longer configured for Ply.");
    return;
  }

  let member = interaction.member;
  if (!member?.roles?.cache?.size) {
    member = await resolveMember(interaction.guild, interaction.user.id);
  }
  if (!isStaff(member, interaction.guild, config, type)) {
    await interaction.editReply("Only the configured team can claim tickets.");
    return;
  }
  if (!claimTicket(ticket.id, interaction.user.id)) {
    await interaction.editReply("This ticket has already been claimed.");
    return;
  }

  const channel = await interaction.guild.channels
    .fetch(ticket.channel_id)
    .catch(() => null);
  if (!channel) {
    await interaction.editReply("The ticket channel no longer exists.");
    return;
  }
  await grantTicketAccess(channel, interaction.user.id).catch((error) =>
    log.warn(`Could not grant claim access for ${ticket.id}`, error),
  );

  const variables = ticketVariables({
    guild: interaction.guild,
    config,
    type,
    ticket: getTicketById(ticket.id) || ticket,
    channel,
    user: await interaction.client.users.fetch(ticket.owner_id).catch(() => null),
    member,
    staff: interaction.user,
    staffMember: member,
  });
  const claimedEmbed = buildEmbed(
    config,
    effectiveMessage(config, type, "claimed"),
    variables,
    { color: config.identity.successColor },
  );
  const waitingEmbed = buildEmbed(
    config,
    effectiveMessage(config, type, "waiting"),
    variables,
    { assetUrl: effectiveAsset(config, type, "spinnerGif") },
  );

  const ping = config.behavior.pingOwnerOnClaim
    ? `<@${ticket.owner_id}>`
    : undefined;
  const mention = {
    parse: [],
    users: config.behavior.pingOwnerOnClaim ? [ticket.owner_id] : [],
  };

  let claimedMessage = null;
  if (ticket.pending_message_id) {
    const existing = await channel.messages
      .fetch(ticket.pending_message_id)
      .catch(() => null);
    if (existing) {
      claimedMessage = await existing
        .edit({
          content: ping || "",
          embeds: [claimedEmbed],
          components: [buildCloseButton(config, ticket.id)],
          allowedMentions: mention,
        })
        .catch(() => null);
    }
  }
  if (!claimedMessage) {
    claimedMessage = await channel
      .send({
        content: ping,
        embeds: [claimedEmbed],
        components: [buildCloseButton(config, ticket.id)],
        allowedMentions: mention,
      })
      .catch((error) => {
        log.error(`Could not send claimed message for ${ticket.id}`, error);
        return null;
      });
  }

  if (claimedMessage) {
    const timer = setTimeout(async () => {
      const fresh = await channel.messages
        .fetch(claimedMessage.id)
        .catch(() => null);
      if (!fresh) return;
      await fresh
        .edit({
          content: "",
          embeds: [waitingEmbed],
          components: [buildCloseButton(config, ticket.id)],
        })
        .catch((error) =>
          log.warn(`Could not switch ${ticket.id} to waiting`, error),
        );
    }, effectiveTiming(config, type, "claimedToSpinnerMs"));
    timer.unref?.();
  }

  if (ticket.support_message_id) {
    const supportMessage = await interaction.channel.messages
      .fetch(ticket.support_message_id)
      .catch(() => null);
    if (supportMessage) {
      await supportMessage
        .edit({ components: [buildClaimedButton(config)] })
        .catch(() => {});
    }
  }

  await interaction.editReply(
    `You claimed **${type?.name || "ticket"}**. Ticket: <#${channel.id}>`,
  );
}
