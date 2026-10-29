import { ChannelType } from "discord.js";
import {
  buildCloseButton,
  buildSubmitRow,
} from "../lib/components.js";
import {
  beginTicketSaving,
  beginTicketSubmit,
  getConfig,
  getTicketById,
  getTicketsByStatus,
  markTicketAnswering,
  markTicketAwaitingSubmit,
  markTicketSubmitted,
  saveTicketProgress,
  setTicketData,
  setTicketStatus,
  setTicketSummaryMessage,
} from "../lib/db.js";
import {
  buildEmbed,
  buildSummaryEmbed,
} from "../lib/format.js";
import { logger } from "../lib/log.js";
import { renderAnswersName } from "../lib/names.js";
import { ticketVariables } from "../lib/placeholders.js";
import { randomInt, sleep } from "../lib/random.js";
import { sendSupportNotification } from "./support.js";
import {
  answersPermissionOverwrites,
  resolveCategory,
} from "./ticketAccess.js";
import { effectiveAsset, effectiveMessage, effectiveTiming } from "@ply/shared";

const log = logger("questions");

function findType(config, typeId) {
  return config?.ticketTypes?.find((entry) => entry.id === typeId) || null;
}

async function loadContext(client, ticket) {
  const guild = await client.guilds.fetch(ticket.guild_id).catch(() => null);
  if (!guild) return null;
  const config = getConfig(guild.id);
  if (!config) return null;
  const type = findType(config, ticket.type_id);
  if (!type) return null;
  const channel = await guild.channels.fetch(ticket.channel_id).catch(() => null);
  if (!channel) return null;
  const owner = await client.users.fetch(ticket.owner_id).catch(() => null);
  const member = owner
    ? await guild.members.fetch(owner.id).catch(() => null)
    : null;
  return { guild, config, type, channel, owner, member };
}

function questionEmbed(config, type, question, variables) {
  const template = effectiveMessage(config, type, "question");
  return buildEmbed(config, {
    ...template,
    imageUrl: question.imageUrl || template.imageUrl,
    thumbnailUrl: question.thumbnailUrl || template.thumbnailUrl,
  }, variables);
}

async function sendQuestion({
  client,
  ticket,
  context,
  index,
  editMessage = null,
}) {
  const { guild, config, type, channel, owner, member } = context;
  const questions = type.questions || [];
  if (index >= questions.length) {
    await summaryForTicket({ client, ticket, context });
    return null;
  }

  const question = questions[index];
  const variables = ticketVariables({
    guild,
    config,
    type,
    ticket,
    channel,
    user: owner,
    member,
    question: question.question,
    number: index + 1,
    total: questions.length,
  });
  const embed = questionEmbed(config, type, question, variables);
  const payload = { embeds: [embed], components: [] };

  let message;
  if (editMessage) {
    message = await editMessage.edit(payload).catch(() => null);
  }
  if (!message) {
    message = await channel.send(payload).catch((error) => {
      log.error(`Could not send question for ticket ${ticket.id}`, error);
      return null;
    });
  }
  return message;
}

export async function sendPreparingAndStart({
  client,
  guild,
  config,
  type,
  ticket,
  channel,
  owner,
  member,
}) {
  const template = effectiveMessage(config, type, "preparing");
  const variables = ticketVariables({
    guild,
    config,
    type,
    ticket,
    channel,
    user: owner,
    member,
  });
  const embed = buildEmbed(config, template, variables, {
    assetUrl: effectiveAsset(config, type, "preparingGif"),
  });

  const prepMessage = await channel.send({ embeds: [embed] }).catch((error) => {
    log.error(`Could not send preparing message for ticket ${ticket.id}`, error);
    return null;
  });
  if (!prepMessage) {
    return;
  }

  const min = effectiveTiming(config, type, "prepMinSeconds");
  const max = effectiveTiming(config, type, "prepMaxSeconds");
  const delay = randomInt(min, max) * 1000;
  const data = {
    ...ticket.data,
    prepMessageId: prepMessage.id,
    prepEndsAt: Date.now() + delay,
  };
  setTicketData(ticket.id, data);
  ticket.data = data;

  const timer = setTimeout(() => {
    advanceFromPreparing(client, ticket.id).catch((error) =>
      log.error(`Could not advance ticket ${ticket.id}`, error),
    );
  }, delay);
  timer.unref?.();
}

export async function advanceFromPreparing(client, ticketId) {
  const ticket = getTicketById(ticketId);
  if (!ticket || ticket.status !== "preparing") return;
  const context = await loadContext(client, ticket);
  if (!context) return;
  const { channel, config, type, guild, owner, member } = context;
  if (!type.questions?.length) {
    await channel.send({
      embeds: [
        buildEmbed(
          config,
          effectiveMessage(config, type, "welcome"),
          ticketVariables({
            guild,
            config,
            type,
            ticket,
            channel,
            user: owner,
            member,
          }),
        ),
      ],
      components: [buildCloseButton(config, ticket.id)],
    });
    markTicketAnswering(ticket.id);
    return;
  }
  markTicketAnswering(ticket.id);
  ticket.status = "answering";

  let prepMessage = null;
  if (ticket.data?.prepMessageId) {
    prepMessage = await channel.messages
      .fetch(ticket.data.prepMessageId)
      .catch(() => null);
  }
  await sendQuestion({
    client,
    ticket,
    context,
    index: 0,
    editMessage: prepMessage,
  });
}

export async function summaryForTicket({ client, ticket, context }) {
  const { guild, config, type, channel, owner, member } = context;
  const variables = ticketVariables({
    guild,
    config,
    type,
    ticket,
    channel,
    user: owner,
    member,
  });
  const message = effectiveMessage(config, type, "summary");
  const embed = buildSummaryEmbed(
    config,
    message,
    variables,
    ticket.data?.answers || [],
  );
  const summary = await channel
    .send({
      embeds: [embed],
      components: [buildSubmitRow(config, ticket.id)],
    })
    .catch((error) => {
      log.error(`Could not send summary for ticket ${ticket.id}`, error);
      return null;
    });
  if (summary) setTicketSummaryMessage(ticket.id, summary.id);
  return summary;
}

async function continueAfterAnswer({ client, ticket, context, index, data }) {
  const { type } = context;
  if (index >= (type.questions?.length || 0)) {
    markTicketAwaitingSubmit(ticket.id, index, data);
    const fresh = getTicketById(ticket.id);
    if (fresh) await summaryForTicket({ client, ticket: fresh, context });
    return;
  }

  markTicketAnswering(ticket.id);
  const fresh = getTicketById(ticket.id);
  if (!fresh) return;
  await sendQuestion({ client, ticket: fresh, context, index });
}

async function temporaryNotice(channel, content) {
  const message = await channel
    .send({ content, allowedMentions: { parse: [] } })
    .catch(() => null);
  if (message) {
    const timer = setTimeout(() => message.delete().catch(() => {}), 6000);
    timer.unref?.();
  }
}

export async function handleQuestionAnswer(message, ticket) {
  const config = getConfig(ticket.guild_id);
  const type = findType(config, ticket.type_id);
  if (!config || !type) return;
  if (ticket.status !== "answering") return;
  if (ticket.owner_id !== message.author.id) return;

  const question = type.questions?.[ticket.current_question];
  if (!question) return;

  const content = message.content.trim();
  if (!content) {
    await temporaryNotice(
      message.channel,
      "Please send your answer as a text message.",
    );
    return;
  }

  const skipWord = (config.labels.skip || "skip").trim().toLowerCase();
  const wantsSkip =
    content.toLowerCase() === skipWord || content.toLowerCase() === "skip";
  if (wantsSkip && question.required) {
    await temporaryNotice(message.channel, "This question is required.");
    return;
  }
  if (!wantsSkip && content.length > config.behavior.maxAnswerLength) {
    await temporaryNotice(
      message.channel,
      `Your answer is too long. Keep it under ${config.behavior.maxAnswerLength} characters.`,
    );
    return;
  }

  if (!beginTicketSaving(ticket.id)) return;

  const nextIndex = ticket.current_question + 1;
  const data = {
    ...ticket.data,
    answers: [
      ...(ticket.data?.answers || []),
      {
        id: question.id,
        label: question.label,
        question: question.question,
        answer: wantsSkip ? "" : content,
        skipped: wantsSkip,
      },
    ],
  };
  if (!saveTicketProgress(ticket.id, "saving", nextIndex, data)) return;

  const { guild } = message;
  const channel = message.channel;
  const member = message.member;
  const context = {
    guild,
    config,
    type,
    channel,
    owner: message.author,
    member,
  };
  const variables = ticketVariables({
    guild,
    config,
    type,
    ticket,
    channel,
    user: message.author,
    member,
  });

  const savingEmbed = buildEmbed(
    config,
    effectiveMessage(config, type, "saving"),
    variables,
    { assetUrl: effectiveAsset(config, type, "savingGif") },
  );
  const savingMessage = await channel
    .send({ embeds: [savingEmbed] })
    .catch((error) => {
      log.error(`Could not send saving message for ticket ${ticket.id}`, error);
      return null;
    });

  if (!savingMessage) {
    await continueAfterAnswer({
      client: message.client,
      ticket,
      context,
      index: nextIndex,
      data,
    });
    return;
  }

  const saveMin = effectiveTiming(config, type, "saveMinSeconds");
  const saveMax = effectiveTiming(config, type, "saveMaxSeconds");
  await sleep(randomInt(saveMin, saveMax) * 1000);

  const savedEmbed = buildEmbed(
    config,
    effectiveMessage(config, type, "saved"),
    variables,
    {
      assetUrl: effectiveAsset(config, type, "successGif"),
      color: config.identity.successColor,
    },
  );
  await savingMessage.edit({ embeds: [savedEmbed] }).catch(() => {});

  const gap = effectiveTiming(config, type, "nextQuestionMs");
  if (gap > 0) await sleep(gap);

  await continueAfterAnswer({
    client: message.client,
    ticket,
    context,
    index: nextIndex,
    data,
  });
}

export async function submitApplication(interaction, ticket) {
  const config = getConfig(ticket.guild_id);
  const type = findType(config, ticket.type_id);
  if (!config || !type) {
    await interaction.editReply("This ticket type is no longer configured.");
    return;
  }

  if (ticket.status !== "awaiting_submit") {
    await interaction.editReply("This application is no longer waiting to be sent.");
    return;
  }
  if (interaction.user.id !== ticket.owner_id) {
    await interaction.editReply("Only the ticket owner can submit this application.");
    return;
  }
  if (!beginTicketSubmit(ticket.id)) {
    await interaction.editReply("This application has already been submitted.");
    return;
  }

  const guild = interaction.guild;
  const channel = interaction.channel;
  const owner = interaction.user;
  const member = interaction.member;
  let answersChannel = null;
  let persisted = false;

  try {
    const category = channel.parentId
      ? await resolveCategory(guild, channel.parentId, false)
      : await resolveCategory(
          guild,
          type.categoryId || config.defaults.categoryId,
          false,
        );
    const variables = ticketVariables({
      guild,
      config,
      type,
      ticket,
      channel,
      user: owner,
      member,
    });
    const name = renderAnswersName(
      type.answersNameFormat,
      {
        ...variables,
        ticket: channel.name,
        ticketName: channel.name,
      },
      config.defaults.answersNameFormat,
    );

    answersChannel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category?.id || undefined,
      topic: `Ply answers • ${type.name} • ${owner.tag}`,
      permissionOverwrites: answersPermissionOverwrites(
        guild,
        interaction.client.user.id,
        config,
        type,
      ),
      reason: `Ply answers for ${channel.name}`,
    });

    const summaryMessage = effectiveMessage(config, type, "summary");
    const embed = buildSummaryEmbed(
      config,
      summaryMessage,
      variables,
      ticket.data?.answers || [],
    );
    const archive = await answersChannel.send({ embeds: [embed] });

    markTicketSubmitted(ticket.id, answersChannel.id, archive.id);
    persisted = true;
    const updated = getTicketById(ticket.id);

    const submittedEmbed = buildEmbed(
      config,
      effectiveMessage(config, type, "submitted"),
      {
        ...variables,
        answers: `<#${answersChannel.id}>`,
        answersName: answersChannel.name,
      },
      { color: config.identity.successColor },
    );
    const summaryMessageId =
      ticket.summary_message_id || updated?.summary_message_id;
    if (summaryMessageId) {
      const review = await channel.messages
        .fetch(summaryMessageId)
        .catch(() => null);
      if (review) {
        await review
          .edit({
            embeds: [submittedEmbed],
            components: [buildCloseButton(config, ticket.id)],
          })
          .catch(() => {});
      } else {
        await channel
          .send({
            embeds: [submittedEmbed],
            components: [buildCloseButton(config, ticket.id)],
          })
          .catch(() => {});
      }
    }

    if (updated) {
      await sendSupportNotification({
        guild,
        config,
        type,
        ticket: {
          ...updated,
          data: {
            ...updated.data,
            firstMessage: `Application submitted · ${ticket.data?.answers?.length || 0} answers`,
          },
        },
        channel,
        owner,
        member,
      }).catch((error) =>
        log.warn(`Could not notify staff for ticket ${ticket.id}`, error),
      );
    }

    await interaction.editReply("Application submitted. The team has been notified.");
  } catch (error) {
    log.error(`Could not submit ticket ${ticket.id}`, error);
    if (!persisted) {
      setTicketStatus(ticket.id, "awaiting_submit");
      if (answersChannel) answersChannel.delete().catch(() => {});
    }
    await interaction
      .editReply(
        persisted
          ? "The application was saved, but some follow-up messages failed."
          : "Could not submit the application. Please try again.",
      )
      .catch(() => {});
  }
}

export async function resumeInFlightTickets(client) {
  const preparing = getTicketsByStatus("preparing");
  for (const ticket of preparing) {
    const remaining = (ticket.data?.prepEndsAt || 0) - Date.now();
    const wait = Math.min(120_000, Math.max(1500, remaining));
    const timer = setTimeout(() => {
      advanceFromPreparing(client, ticket.id).catch((error) =>
        log.error(`Could not resume preparing ticket ${ticket.id}`, error),
      );
    }, wait);
    timer.unref?.();
  }

  const saving = getTicketsByStatus("saving");
  for (const ticket of saving) {
    const timer = setTimeout(async () => {
      const fresh = getTicketById(ticket.id);
      if (!fresh) return;
      const context = await loadContext(client, fresh);
      if (!context) return;
      const savedCount = fresh.data?.answers?.length || 0;
      const index = Math.max(fresh.current_question, savedCount);
      await continueAfterAnswer({
        client,
        ticket: fresh,
        context,
        index,
        data: fresh.data || { answers: [] },
      });
    }, 1500);
    timer.unref?.();
  }

  const awaiting = getTicketsByStatus("awaiting_submit");
  for (const ticket of awaiting) {
    if (ticket.summary_message_id) continue;
    const timer = setTimeout(async () => {
      const fresh = getTicketById(ticket.id);
      if (!fresh || fresh.summary_message_id) return;
      const context = await loadContext(client, fresh);
      if (!context) return;
      await summaryForTicket({ client, ticket: fresh, context });
    }, 1500);
    timer.unref?.();
  }

  const submitting = getTicketsByStatus("submitting");
  for (const ticket of submitting) {
    setTicketStatus(ticket.id, "awaiting_submit");
  }
}
