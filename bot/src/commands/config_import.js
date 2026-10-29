import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { requireGuildOwner } from "../features/config.js";

export const data = new SlashCommandBuilder()
  .setName("config_import")
  .setDescription("Import a Ply dashboard config (owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  if (!(await requireGuildOwner(interaction))) return;

  const modal = new ModalBuilder()
    .setCustomId("ply:config:import")
    .setTitle("Import Ply config");
  const input = new TextInputBuilder()
    .setCustomId("config")
    .setLabel("Config code")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("PLY1:...")
    .setRequired(true)
    .setMaxLength(4000);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}
