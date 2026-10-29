import {
  clearGuildPanelMessage,
  getGuildMeta,
  setGuildPanel,
} from "../lib/db.js";
import {
  buildPanelComponents,
} from "../lib/components.js";
import { buildPanelEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { ticketVariables } from "../lib/placeholders.js";

const log = logger("panel");

export async function publishPanel(client, guild, config) {
  const channelId = config.panel.channelId;
  if (!channelId) {
    throw new Error("No panel channel is configured. Import a config with a panel channel first.");
  }
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) {
    throw new Error("The configured panel channel does not exist or cannot receive messages.");
  }

  const types = config.ticketTypes.filter((type) => type.enabled);
  if (!types.length) {
    throw new Error("No enabled ticket types are configured.");
  }

  const meta = getGuildMeta(guild.id);
  if (meta?.panel_message_id) {
    const oldChannel = meta.panel_channel_id
      ? await guild.channels.fetch(meta.panel_channel_id).catch(() => null)
      : null;
    if (oldChannel?.isTextBased?.()) {
      const oldMessage = await oldChannel.messages
        .fetch(meta.panel_message_id)
        .catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => {});
    }
    clearGuildPanelMessage(guild.id);
  }

  const variables = ticketVariables({ guild, config, type: null });
  const embed = buildPanelEmbed(config, variables);
  const message = await channel.send({
    embeds: [embed],
    components: buildPanelComponents(config, types),
    allowedMentions: { parse: [] },
  });
  setGuildPanel(guild.id, channel.id, message.id);
  log.info(`Published panel in ${guild.id}/${channel.id}.`);
  return message;
}
