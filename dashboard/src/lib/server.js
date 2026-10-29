export function categories(server) {
  return (server?.channels || [])
    .filter((channel) => channel.type === "category")
    .sort((a, b) => a.position - b.position);
}

export function textChannels(server) {
  return (server?.channels || [])
    .filter((channel) =>
      ["text", "announcement", "forum", "media"].includes(channel.type),
    )
    .sort((a, b) => a.position - b.position);
}

export function channelsGrouped(server) {
  const groups = [];
  const cats = categories(server);
  for (const category of cats) {
    groups.push({
      label: category.name,
      options: textChannels(server)
        .filter((channel) => channel.parentId === category.id)
        .map((channel) => ({ value: channel.id, label: `# ${channel.name}` })),
    });
  }
  const groupedIds = new Set(
    groups.flatMap((group) => group.options.map((option) => option.value)),
  );
  const loose = textChannels(server).filter(
    (channel) => !groupedIds.has(channel.id),
  );
  if (loose.length) {
    groups.push({
      label: "No category",
      options: loose.map((channel) => ({
        value: channel.id,
        label: `# ${channel.name}`,
      })),
    });
  }
  return groups.filter((group) => group.options.length);
}

export function categoryOptions(server) {
  return categories(server).map((channel) => ({
    value: channel.id,
    label: channel.name,
  }));
}

export function roleOptions(server) {
  return (server?.roles || [])
    .slice()
    .sort((a, b) => b.position - a.position)
    .map((role) => ({ value: role.id, label: role.name }));
}

export function channelLabel(server, id) {
  if (!id) return "Not set";
  const channel = server?.channels?.find((entry) => entry.id === id);
  return channel ? `# ${channel.name}` : id;
}

export function roleLabel(server, id) {
  if (!id) return id;
  const role = server?.roles?.find((entry) => entry.id === id);
  return role ? `@${role.name}` : id;
}

export function serverIsImported(server) {
  return Boolean(server?.guild?.id && server.channels.length);
}
