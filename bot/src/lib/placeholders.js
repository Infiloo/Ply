import { oneLine } from "./format.js";

export function ticketVariables({
  guild,
  config,
  type,
  ticket,
  channel,
  user,
  member,
  staff,
  staffMember,
  answersChannel,
  question,
  number,
  total,
}) {
  const now = Math.floor(Date.now() / 1000);
  const staffName =
    staffMember?.displayName || staff?.displayName || staff?.username || "";
  const ownerMember = member && member.id === user?.id ? member : null;

  return {
    user: user ? `<@${user.id}>` : "",
    username: user?.username || "",
    userId: user?.id || "",
    userAvatar:
      ownerMember?.displayAvatarURL?.({ size: 128 }) ||
      user?.displayAvatarURL?.({ size: 128 }) ||
      "",
    type: type?.name || "",
    ticket: channel ? `<#${channel.id}>` : "",
    ticketName: channel?.name || "",
    ticketId: ticket?.id || "",
    staff: staff ? `<@${staff.id}>` : "a team member",
    staffName: staffName || "a team member",
    answers: answersChannel ? `<#${answersChannel.id}>` : "",
    answersName: answersChannel?.name || "",
    number: number ?? "",
    total: total ?? "",
    question: question || "",
    firstMessage: oneLine(ticket?.data?.firstMessage || "—", 280),
    claimLabel: config.labels.claim,
    sendLabel: config.labels.send,
    skipLabel: config.labels.skip,
    guild: guild?.name || "",
    botName: config.identity?.botName || "Ply",
    date: `<t:${now}:D>`,
    time: `<t:${now}:t>`,
  };
}
