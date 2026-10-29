import {
  Client,
  Events,
  GatewayIntentBits,
  Options,
  Partials,
} from "discord.js";
import { appConfig } from "./config.js";
import { commandMap } from "./commands/index.js";
import { closeDatabase } from "./lib/db.js";
import { logger } from "./lib/log.js";
import { handleInteraction } from "./features/interactions.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleChannelDelete } from "./events/channelDelete.js";
import { handleReady } from "./events/ready.js";

const log = logger("main");

if (!appConfig.token) {
  log.error("DISCORD_TOKEN is missing. Copy bot/.env.example to bot/.env first.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  allowedMentions: { parse: [], repliedUser: false },
  rest: {
    timeout: appConfig.restTimeoutMs,
    retries: appConfig.restRetries,
  },
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    GuildStickerManager: 0,
    GuildEmojiManager: 0,
    GuildInviteManager: 0,
    GuildMemberManager: 25,
    UserManager: 50,
    VoiceStateManager: 0,
    GuildBanManager: 0,
    StageInstanceManager: 0,
    GuildScheduledEventManager: 0,
    AutoModerationRuleManager: 0,
    ThreadManager: 0,
  }),
});

client.commands = commandMap();

client.once(Events.ClientReady, (readyClient) => {
  handleReady(readyClient).catch((error) =>
    log.error("Ready handler failed", error),
  );
});

client.on(Events.InteractionCreate, (interaction) => {
  handleInteraction(client, interaction).catch((error) =>
    log.error("Unhandled interaction error", error),
  );
});

client.on(Events.MessageCreate, (message) => {
  handleMessageCreate(message).catch((error) =>
    log.error("Message handler failed", error),
  );
});

client.on(Events.ChannelDelete, (channel) => {
  handleChannelDelete(channel).catch((error) =>
    log.error("Channel delete handler failed", error),
  );
});

client.on(Events.Error, (error) => log.error("Discord client error", error));
client.on(Events.Warn, (warning) => log.warn(warning));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info(`Shutting down (${signal})…`);
  try {
    await client.destroy();
  } finally {
    closeDatabase();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) =>
  log.error("Unhandled promise rejection", error),
);
process.on("uncaughtException", (error) => {
  log.error("Uncaught exception", error);
  shutdown("uncaughtException");
});

client.login(appConfig.token).catch((error) => {
  log.error("Could not log in. Check DISCORD_TOKEN and the Message Content intent.", error);
  process.exit(1);
});
