import { ChannelType, PermissionFlagsBits } from "discord.js";
import { adminRoleIds, staffRoleIds, uniqueIds } from "../lib/permissions.js";

const BASE_ALLOW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.UseExternalEmojis,
];

function ticketOverwrites(guild, clientId, config, type, ownerId) {
  const admins = adminRoleIds(config, type);
  const staff = type.mode === "classic" ? staffRoleIds(config, type) : [];
  const allowedRoles = uniqueIds(admins, staff);
  const allowedIds = uniqueIds(
    [clientId, ownerId, guild.ownerId],
    allowedRoles,
  );

  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    ...allowedIds.map((id) => ({ id, allow: BASE_ALLOW })),
  ];
}

function answersOverwrites(guild, clientId, config, type) {
  const allowedIds = uniqueIds(
    [clientId, guild.ownerId],
    adminRoleIds(config, type),
  );
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    ...allowedIds.map((id) => ({ id, allow: BASE_ALLOW })),
  ];
}

export async function resolveCategory(guild, categoryId, required = false) {
  if (!categoryId) return null;
  const channel = await guild.channels.fetch(categoryId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildCategory) {
    if (required) throw new Error("The configured ticket category is missing.");
    return null;
  }
  return channel;
}

export function ticketPermissionOverwrites(
  guild,
  clientId,
  config,
  type,
  ownerId,
) {
  return ticketOverwrites(guild, clientId, config, type, ownerId);
}

export function answersPermissionOverwrites(guild, clientId, config, type) {
  return answersOverwrites(guild, clientId, config, type);
}

export async function grantTicketAccess(channel, userId) {
  if (!channel || !userId) return;
  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true,
    UseExternalEmojis: true,
  });
}
