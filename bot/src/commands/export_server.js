import {
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { handleExportServer } from "../features/config.js";

export const data = new SlashCommandBuilder()
  .setName("export_server")
  .setDescription("Export channels and roles for the Ply dashboard (owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await handleExportServer(interaction);
}
