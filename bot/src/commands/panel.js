import {
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { handlePanelCommand } from "../features/config.js";

export const data = new SlashCommandBuilder()
  .setName("panel")
  .setDescription("Publish or refresh the configured ticket panel (owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await handlePanelCommand(interaction);
}
