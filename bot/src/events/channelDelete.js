import {
  clearAnswersChannel,
  closeTicket,
  getTicketByAnswersChannel,
  getTicketByChannel,
} from "../lib/db.js";
import { logger } from "../lib/log.js";
import { untrackTicketChannel } from "../runtime.js";

const log = logger("channels");

export async function handleChannelDelete(channel) {
  const ticket = getTicketByChannel(channel.id);
  if (ticket) {
    if (ticket.status !== "closed") closeTicket(ticket.id);
    untrackTicketChannel(channel.id);
    log.info(`Ticket ${ticket.id} closed because its channel was deleted.`);
    return;
  }

  const answerTicket = getTicketByAnswersChannel(channel.id);
  if (answerTicket) {
    clearAnswersChannel(answerTicket.id);
    log.info(`Answers channel for ticket ${answerTicket.id} was deleted.`);
  }
}
