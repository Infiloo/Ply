import {
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { handleConfigExport } from "../features/config.js";

export const data = new SlashCommandBuilder()
  .setName("config_export")
  .setDescription("Export this server's Ply config (owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await handleConfigExport(interaction);
}
