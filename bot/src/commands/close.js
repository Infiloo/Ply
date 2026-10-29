import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { getTicketByChannel } from "../lib/db.js";
import { handleCloseRequest } from "../features/close.js";

export const data = new SlashCommandBuilder()
  .setName("close")
  .setDescription("Close the current Ply ticket");

export async function execute(interaction) {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({
      content: "This command only works inside a ticket channel.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const ticket = getTicketByChannel(interaction.channel.id);
  if (!ticket || ticket.status === "closed") {
    await interaction.reply({
      content: "This is not an open Ply ticket.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await handleCloseRequest(interaction, ticket.id);
}
