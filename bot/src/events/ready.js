import { ActivityType } from "discord.js";
import { getActiveTicketChannelIds } from "../lib/db.js";
import { logger } from "../lib/log.js";
import { activeTicketChannels } from "../runtime.js";
import { resumeInFlightTickets } from "../features/questions.js";
import { appConfig } from "../config.js";

const log = logger("ready");

export async function handleReady(client) {
  for (const channelId of getActiveTicketChannelIds()) {
    activeTicketChannels.add(channelId);
  }
  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: appConfig.presence.slice(0, 128),
        type: ActivityType.Watching,
      },
    ],
  });
  log.info(
    `Ply online as ${client.user.tag} · ${client.guilds.cache.size} guild(s) · ${activeTicketChannels.size} open ticket(s)`,
  );
  await resumeInFlightTickets(client);
}
