import { ChannelType, MessageFlags } from "discord.js";
import { buildCloseButton } from "../lib/components.js";
import {
  closeTicket,
  createTicket,
  getConfig,
  getOpenTicketForUser,
  newTicketId,
} from "../lib/db.js";
import { buildEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { renderTicketName } from "../lib/names.js";
import { ticketVariables } from "../lib/placeholders.js";
import { trackTicketChannel } from "../runtime.js";
import { sendPreparingAndStart } from "./questions.js";
import { resolveSupportChannel } from "./support.js";
import {
  resolveCategory,
  ticketPermissionOverwrites,
} from "./ticketAccess.js";
import { effectiveMessage } from "@ply/shared";

const log = logger("tickets");

function findType(config, typeId) {
  return config?.ticketTypes?.find((entry) => entry.id === typeId) || null;
}

export async function handleOpenTicket(interaction, typeId) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) {
    await interaction.editReply("Tickets only work inside a server.");
    return;
  }

  const config = getConfig(interaction.guild.id);
  if (!config) {
    await interaction.editReply(
      "Ply is not configured on this server yet. Ask the owner to run /config_import.",
    );
    return;
  }
  const type = findType(config, typeId);
  if (!type || !type.enabled) {
    await interaction.editReply("That ticket type is not available.");
    return;
  }
  if (type.mode === "questions" && !type.questions.length) {
    await interaction.editReply("This ticket type has no questions configured.");
    return;
  }

  const supportChannel = await resolveSupportChannel(
    interaction.guild,
    config,
    type,
  );
  if (!supportChannel) {
    await interaction.editReply(
      "This ticket type has no valid support channel configured.",
    );
    return;
  }

  if (config.behavior.oneOpenPerType) {
    const existing = getOpenTicketForUser(
      interaction.guild.id,
      interaction.user.id,
      type.id,
    );
    if (existing) {
      const existingChannel = await interaction.guild.channels
        .fetch(existing.channel_id)
        .catch(() => null);
      if (existingChannel) {
        const variables = ticketVariables({
          guild: interaction.guild,
          config,
          type,
          ticket: existing,
          channel: existingChannel,
          user: interaction.user,
          member: interaction.member,
        });
        const embed = buildEmbed(
          config,
          effectiveMessage(config, type, "alreadyOpen"),
          variables,
          { color: config.identity.dangerColor },
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      closeTicket(existing.id);
    }
  }

  let channel = null;
  let ticketId = null;
  try {
    const category = await resolveCategory(
      interaction.guild,
      type.categoryId || config.defaults.categoryId,
      true,
    );
    const id = newTicketId();
    const baseVariables = ticketVariables({
      guild: interaction.guild,
      config,
      type,
      ticket: { id, data: {} },
      user: interaction.user,
      member: interaction.member,
    });
    const name = renderTicketName(
      type.ticketNameFormat,
      { ...baseVariables, ticket: "" },
      config.defaults.ticketNameFormat,
    );

    channel = await interaction.guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category?.id || undefined,
      topic: `Ply • ${type.name} • Owner ${interaction.user.tag}`,
      permissionOverwrites: ticketPermissionOverwrites(
        interaction.guild,
        interaction.client.user.id,
        config,
        type,
        interaction.user.id,
      ),
      reason: `Ply ticket for ${interaction.user.tag}`,
    });

    const ticket = createTicket({
      id,
      guildId: interaction.guild.id,
      channelId: channel.id,
      typeId: type.id,
      ownerId: interaction.user.id,
      mode: type.mode,
      status: type.mode === "questions" ? "preparing" : "open",
      data: { answers: [], firstMessage: "" },
    });
    if (!ticket) throw new Error("Could not persist the ticket.");
    ticketId = ticket.id;
    trackTicketChannel(channel.id);

    const variables = ticketVariables({
      guild: interaction.guild,
      config,
      type,
      ticket,
      channel,
      user: interaction.user,
      member: interaction.member,
    });

    if (type.mode === "questions") {
      await sendPreparingAndStart({
        client: interaction.client,
        guild: interaction.guild,
        config,
        type,
        ticket,
        channel,
        owner: interaction.user,
        member: interaction.member,
      });
    } else {
      const welcome = buildEmbed(
        config,
        effectiveMessage(config, type, "welcome"),
        variables,
      );
      await channel
        .send({
          embeds: [welcome],
          components: [buildCloseButton(config, ticket.id)],
        })
        .catch((error) => {
          log.error(`Could not send welcome for ${ticket.id}`, error);
        });
    }

    await interaction.editReply(
      `Your **${type.name}** ticket is ready: <#${channel.id}>`,
    );
  } catch (error) {
    log.error(`Could not create ticket for ${interaction.user.id}/${type.id}`, error);
    if (ticketId) closeTicket(ticketId);
    if (channel) {
      await channel.delete("Ply ticket setup failed").catch(() => {});
    }
    await interaction.editReply(
      "Could not create the ticket. Please check the panel, category, and bot permissions.",
    );
  }
}
