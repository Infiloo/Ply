export const activeTicketChannels = new Set();

export function trackTicketChannel(channelId) {
  if (channelId) activeTicketChannels.add(channelId);
}

export function untrackTicketChannel(channelId) {
  if (channelId) activeTicketChannels.delete(channelId);
}

export function isTrackedTicketChannel(channelId) {
  return activeTicketChannels.has(channelId);
}
