import { MessageFlags } from "discord.js";
import { getTicketById } from "../lib/db.js";
import { logger } from "../lib/log.js";
import {
  handleConfigImportModal,
  handlePublishButton,
} from "./config.js";
import { handleClaim } from "./claim.js";
import {
  handleCloseCancel,
  handleCloseConfirm,
  handleCloseRequest,
} from "./close.js";
import { handleOpenTicket } from "./createTicket.js";
import { submitApplication } from "./questions.js";

const log = logger("interactions");

async function fail(interaction, error) {
  log.error("Interaction failed", error);
  const content = "Something went wrong. Please try again.";
  try {
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else if (interaction.replied) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  } catch {
    // The interaction token can expire; nothing else to do.
  }
}

async function routeButton(interaction) {
  const [prefix, action, ...rest] = interaction.customId.split(":");
  if (prefix !== "ply") return;
  const argument = rest.join(":");

  switch (action) {
    case "type":
      await handleOpenTicket(interaction, argument);
      return;
    case "claim":
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await handleClaim(interaction, argument);
      return;
    case "submit": {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const ticket = getTicketById(argument);
      if (!ticket) {
        await interaction.editReply("This ticket no longer exists.");
        return;
      }
      await submitApplication(interaction, ticket);
      return;
    }
    case "close":
      await handleCloseRequest(interaction, argument);
      return;
    case "close-confirm":
      await handleCloseConfirm(interaction, argument);
      return;
    case "close-cancel":
      await handleCloseCancel(interaction);
      return;
    case "panel":
      if (rest[0] === "publish") {
        await handlePublishButton(interaction);
        return;
      }
      break;
    default:
      break;
  }

  await interaction.reply({
    content: "Unknown Ply action.",
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleInteraction(client, interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      await routeButton(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ply:open:select") {
        const typeId = interaction.values[0];
        if (typeId) await handleOpenTicket(interaction, typeId);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "ply:config:import") {
        await handleConfigImportModal(interaction);
      }
    }
  } catch (error) {
    await fail(interaction, error);
  }
}
