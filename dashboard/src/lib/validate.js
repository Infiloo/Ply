export function validateConfig(config, server) {
  const warnings = [];
  const hasServer = Boolean(server?.guild?.id);
  const channelExists = (id) =>
    !hasServer || server.channels.some((channel) => channel.id === id);
  const roleExists = (id) =>
    !hasServer || server.roles.some((role) => role.id === id);

  if (!config.panel.channelId) {
    warnings.push("Panel channel is not set.");
  } else if (!channelExists(config.panel.channelId)) {
    warnings.push("Panel channel is not in the imported server.");
  }

  const enabled = config.ticketTypes.filter((type) => type.enabled);
  if (!enabled.length) warnings.push("No ticket types are enabled.");

  if (!config.permissions.adminRoleIds.length) {
    warnings.push("No admin roles: answers channels will only be visible to the owner and Ply.");
  }
  if (!config.permissions.staffRoleIds.length) {
    warnings.push("No global staff roles: add staff roles globally or per type.");
  }

  for (const role of config.permissions.adminRoleIds) {
    if (!roleExists(role)) warnings.push(`Admin role ${role} is not in the imported server.`);
  }
  for (const role of config.permissions.staffRoleIds) {
    if (!roleExists(role)) warnings.push(`Staff role ${role} is not in the imported server.`);
  }

  const ids = new Set();
  for (const type of enabled) {
    if (ids.has(type.id)) warnings.push(`Duplicate type ID: ${type.id}.`);
    ids.add(type.id);

    const categoryId = type.categoryId || config.defaults.categoryId;
    const supportId = type.supportChannelId || config.defaults.supportChannelId;
    if (!categoryId) warnings.push(`${type.name}: no category.`);
    else if (!channelExists(categoryId)) {
      warnings.push(`${type.name}: category is not in the imported server.`);
    }
    if (!supportId) warnings.push(`${type.name}: no support channel.`);
    else if (!channelExists(supportId)) {
      warnings.push(`${type.name}: support channel is not in the imported server.`);
    }
    if (type.mode === "questions" && type.questions.length === 0) {
      warnings.push(`${type.name}: guided mode has no questions.`);
    }
  }

  if (
    config.panel.style === "buttons" &&
    enabled.length > 5
  ) {
    warnings.push("More than five types: the panel will fall back to a dropdown.");
  }

  if (enabled.length > 24) {
    warnings.push("More than 24 enabled types: extra types cannot be displayed.");
  }

  return [...new Set(warnings)].slice(0, 14);
}
