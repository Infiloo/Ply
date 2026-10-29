import { appConfig } from "../config.js";

export function uniqueIds(...lists) {
  return [...new Set(lists.flat().filter(Boolean))];
}

export function adminRoleIds(config, type) {
  return uniqueIds(config.permissions.adminRoleIds, type?.adminRoleIds || []);
}

export function staffRoleIds(config, type) {
  return uniqueIds(config.permissions.staffRoleIds, type?.staffRoleIds || []);
}

export function isGuildOwner(guild, userId) {
  return guild?.ownerId === userId || appConfig.ownerIds.has(userId);
}

export function hasAnyRole(member, roleIds) {
  if (!member || !roleIds?.length) return false;
  return roleIds.some((roleId) => member.roles?.cache?.has(roleId));
}

export function isAdmin(member, guild, config, type) {
  if (!member) return false;
  if (isGuildOwner(guild, member.id)) return true;
  return hasAnyRole(member, adminRoleIds(config, type));
}

export function isStaff(member, guild, config, type) {
  if (!member) return false;
  if (isGuildOwner(guild, member.id)) return true;
  return (
    hasAnyRole(member, adminRoleIds(config, type)) ||
    hasAnyRole(member, staffRoleIds(config, type))
  );
}

export function canClose(ticket, member, guild, config, type) {
  if (!member || !ticket) return false;
  if (ticket.owner_id === member.id) {
    return config.behavior.allowUserClose;
  }
  if (ticket.claimed_by === member.id) return true;
  return isStaff(member, guild, config, type);
}

export async function resolveMember(guild, userId) {
  if (!guild || !userId) return null;
  const cached = guild.members.cache.get(userId);
  if (cached) return cached;
  try {
    return await guild.members.fetch(userId);
  } catch {
    return null;
  }
}
