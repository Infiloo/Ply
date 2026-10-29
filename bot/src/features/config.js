import { AttachmentBuilder, MessageFlags } from "discord.js";
import {
  decodeConfig,
  encodeConfig,
  encodeServerMap,
  channelTypeName,
} from "@ply/shared";
import { saveConfig, getConfig } from "../lib/db.js";
import { buildPublishRow } from "../lib/components.js";
import { logger } from "../lib/log.js";
import { isGuildOwner } from "../lib/permissions.js";
import { publishPanel } from "./panel.js";

const log = logger("config");

export async function requireGuildOwner(interaction) {
  if (interaction.guild && isGuildOwner(interaction.guild, interaction.user.id)) {
    return true;
  }
  const payload = {
    content: "Only the server owner can use this.",
    flags: MessageFlags.Ephemeral,
  };
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: payload.content });
  } else {
    await interaction.reply(payload);
  }
  return false;
}

export async function validateConfigForGuild(guild, config) {
  const warnings = [];
  const panelChannel = config.panel.channelId
    ? guild.channels.cache.get(config.panel.channelId)
    : null;
  if (!config.panel.channelId) {
    warnings.push("No panel channel is set.");
  } else if (!panelChannel) {
    warnings.push("The panel channel ID does not exist in this server.");
  }

  if (!config.permissions.adminRoleIds.length) {
    warnings.push("No admin roles: answers channels will only be visible to the owner and Ply.");
  }
  if (!config.permissions.staffRoleIds.length) {
    warnings.push("No staff roles: only admins and the owner can claim tickets.");
  }

  for (const type of config.ticketTypes.filter((entry) => entry.enabled)) {
    const categoryId = type.categoryId || config.defaults.categoryId;
    const supportId = type.supportChannelId || config.defaults.supportChannelId;
    if (!categoryId) warnings.push(`${type.name}: no category set.`);
    else if (!guild.channels.cache.get(categoryId)) {
      warnings.push(`${type.name}: category ID not found.`);
    }
    if (!supportId) warnings.push(`${type.name}: no support channel set.`);
    else if (!guild.channels.cache.get(supportId)) {
      warnings.push(`${type.name}: support channel ID not found.`);
    }
    if (type.mode === "questions" && !type.questions.length) {
      warnings.push(`${type.name}: question flow has no questions.`);
    }
  }

  const enabled = config.ticketTypes.filter((type) => type.enabled).length;
  if (!enabled) warnings.push("No ticket types are enabled.");

  return warnings.slice(0, 10);
}

export async function handleConfigImportModal(interaction) {
  if (!(await requireGuildOwner(interaction))) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const code = interaction.fields.getTextInputValue("config");
  try {
    const config = await decodeConfig(code);
    saveConfig(interaction.guild.id, config);
    const warnings = await validateConfigForGuild(interaction.guild, config);
    const enabled = config.ticketTypes.filter((type) => type.enabled).length;
    const questionTypes = config.ticketTypes.filter(
      (type) => type.mode === "questions",
    ).length;
    const lines = [
      "**Ply config imported.**",
      `${enabled} ticket type${enabled === 1 ? "" : "s"} enabled · ${questionTypes} question flow${questionTypes === 1 ? "" : "s"}`,
    ];
    if (warnings.length) {
      lines.push("", "**Check these:**");
      for (const warning of warnings) lines.push(`• ${warning}`);
    }
    lines.push("", "Run **/panel** or press the button below to publish the panel.");
    await interaction.editReply({
      content: lines.join("\n").slice(0, 1990),
      components: config.panel.channelId ? [buildPublishRow()] : [],
    });
  } catch (error) {
    log.warn(`Invalid config import in ${interaction.guild.id}: ${error.message}`);
    await interaction.editReply(`Import failed: ${error.message}`);
  }
}

export async function handlePublishButton(interaction) {
  if (!(await requireGuildOwner(interaction))) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const config = getConfig(interaction.guild.id);
  if (!config) {
    await interaction.editReply("No config found. Import one first.");
    return;
  }
  try {
    const message = await publishPanel(
      interaction.client,
      interaction.guild,
      config,
    );
    await interaction.editReply(
      `Panel published in <#${message.channelId}>.`,
    );
  } catch (error) {
    await interaction.editReply(error.message);
  }
}

export async function handlePanelCommand(interaction) {
  if (!(await requireGuildOwner(interaction))) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const config = getConfig(interaction.guild.id);
  if (!config) {
    await interaction.editReply("No config found. Import one with /config_import.");
    return;
  }
  try {
    const message = await publishPanel(
      interaction.client,
      interaction.guild,
      config,
    );
    await interaction.editReply(`Panel published in <#${message.channelId}>.`);
  } catch (error) {
    await interaction.editReply(error.message);
  }
}

function codePayload(code, prefix) {
  if (code.length <= 1750) {
    return { content: `${prefix}\n\`\`\`\n${code}\n\`\`\`` };
  }
  const file = new AttachmentBuilder(Buffer.from(code, "utf8"), {
    name: "ply-export.txt",
    description: "Ply export code",
  });
  return { content: prefix, files: [file] };
}

export async function handleConfigExport(interaction) {
  if (!(await requireGuildOwner(interaction))) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const config = getConfig(interaction.guild.id);
  if (!config) {
    await interaction.editReply("No config found for this server.");
    return;
  }
  const code = await encodeConfig(config);
  await interaction.editReply(
    codePayload(
      code,
      "Ply config export. Paste this into the dashboard to keep editing, or back into /config_import.",
    ),
  );
}

export async function handleExportServer(interaction) {
  if (!(await requireGuildOwner(interaction))) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channels = await interaction.guild.channels.fetch();
  const roles = await interaction.guild.roles.fetch();
  const map = {
    guild: {
      id: interaction.guild.id,
      name: interaction.guild.name,
      icon: interaction.guild.icon || "",
    },
    channels: [...channels.values()]
      .filter(Boolean)
      .map((channel) => ({
        id: channel.id,
        name: channel.name || "",
        type: channelTypeName(channel.type),
        parentId: channel.parentId || "",
        parentName: channel.parent?.name || "",
        position: channel.rawPosition ?? channel.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position),
    roles: [...roles.values()]
      .filter((role) => role.id !== interaction.guild.id && !role.managed)
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
        managed: role.managed,
      }))
      .sort((a, b) => b.position - a.position),
  };
  const code = await encodeServerMap(map);
  await interaction.editReply(
    codePayload(
      code,
      "Ply server export. Open the dashboard → **Server** and paste this in.",
    ),
  );
}
