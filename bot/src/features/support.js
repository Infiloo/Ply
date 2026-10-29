import { buildClaimButton } from "../lib/components.js";
import { buildEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { staffRoleIds } from "../lib/permissions.js";
import { ticketVariables } from "../lib/placeholders.js";
import { effectiveMessage } from "@ply/shared";

const log = logger("support");

export async function resolveSupportChannel(guild, config, type) {
  const channelId =
    type?.supportChannelId || config.defaults.supportChannelId || "";
  if (!channelId) return null;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) return null;
  return channel;
}

export async function sendSupportNotification({
  guild,
  config,
  type,
  ticket,
  channel,
  owner,
  member,
}) {
  const supportChannel = await resolveSupportChannel(guild, config, type);
  if (!supportChannel) {
    log.warn(
      `No usable support channel for guild ${guild.id}, type ${type.id}.`,
    );
    return null;
  }

  const message = effectiveMessage(config, type, "support");
  const embed = buildEmbed(
    config,
    message,
    ticketVariables({
      guild,
      config,
      type,
      ticket,
      channel,
      user: owner,
      member,
    }),
  );

  const staffRoles = staffRoleIds(config, type);
  const notifyRole =
    config.behavior.notifyStaff && staffRoles.length ? staffRoles[0] : null;

  return supportChannel.send({
    content: notifyRole ? `<@&${notifyRole}>` : undefined,
    embeds: [embed],
    components: [buildClaimButton(config, ticket.id)],
    allowedMentions: {
      parse: [],
      roles: notifyRole ? [notifyRole] : [],
    },
  });
}
