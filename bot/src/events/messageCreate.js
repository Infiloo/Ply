import { getTicketByChannel } from "../lib/db.js";
import { handleClassicFirstMessage } from "../features/classic.js";
import { handleQuestionAnswer } from "../features/questions.js";
import {
  isTrackedTicketChannel,
  untrackTicketChannel,
} from "../runtime.js";

export async function handleMessageCreate(message) {
  if (!message.guild || !message.channel || message.author?.bot) return;
  if (!isTrackedTicketChannel(message.channel.id)) return;

  const ticket = getTicketByChannel(message.channel.id);
  if (!ticket || ticket.status === "closed") {
    untrackTicketChannel(message.channel.id);
    return;
  }
  if (message.author.id !== ticket.owner_id) return;

  if (ticket.mode === "classic" && ticket.status === "open") {
    await handleClassicFirstMessage(message, ticket);
    return;
  }
  if (ticket.mode === "questions" && ticket.status === "answering") {
    await handleQuestionAnswer(message, ticket);
  }
}
