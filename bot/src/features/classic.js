import { buildCloseButton } from "../lib/components.js";
import {
  getConfig,
  getTicketById,
  markTicketPending,
  setTicketPendingMessage,
  setTicketSupportMessage,
} from "../lib/db.js";
import { buildEmbed } from "../lib/format.js";
import { logger } from "../lib/log.js";
import { ticketVariables } from "../lib/placeholders.js";
import { sendSupportNotification } from "./support.js";
import { effectiveAsset, effectiveMessage } from "@ply/shared";

const log = logger("classic");

export async function handleClassicFirstMessage(message, ticket) {
  if (ticket.status !== "open" || ticket.mode !== "classic") return;
  if (ticket.owner_id !== message.author.id) return;

  const config = getConfig(ticket.guild_id);
  const type = config?.ticketTypes?.find((entry) => entry.id === ticket.type_id);
  if (!config || !type) return;

  const data = {
    ...ticket.data,
    firstMessage: (message.content || "Attachment").slice(0, 300),
  };
  if (!markTicketPending(ticket.id, null, data)) return;

  const pendingTemplate = effectiveMessage(config, type, "classicPending");
  const variables = ticketVariables({
    guild: message.guild,
    config,
    type,
    ticket: { ...ticket, data },
    channel: message.channel,
    user: message.author,
    member: message.member,
  });
  const pendingEmbed = buildEmbed(config, pendingTemplate, variables, {
    assetUrl: effectiveAsset(config, type, "pendulumGif"),
  });

  const pendingMessage = await message.channel
    .send({
      embeds: [pendingEmbed],
      components: [buildCloseButton(config, ticket.id)],
    })
    .catch((error) => {
      log.error(`Could not send pending message for ${ticket.id}`, error);
      return null;
    });
  if (pendingMessage) setTicketPendingMessage(ticket.id, pendingMessage.id);

  const fresh = getTicketById(ticket.id);
  if (!fresh) return;

  const supportMessage = await sendSupportNotification({
    guild: message.guild,
    config,
    type,
    ticket: fresh,
    channel: message.channel,
    owner: message.author,
    member: message.member,
  }).catch((error) => {
    log.error(`Could not notify support for ${ticket.id}`, error);
    return null;
  });
  if (supportMessage) setTicketSupportMessage(ticket.id, supportMessage.id);
}
