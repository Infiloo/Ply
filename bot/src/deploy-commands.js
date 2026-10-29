import { REST, Routes } from "discord.js";
import { appConfig } from "./config.js";
import { commands } from "./commands/index.js";
import { logger } from "./lib/log.js";

const log = logger("deploy");
const body = commands.map((command) => command.data.toJSON());

if (!appConfig.token) {
  log.error("DISCORD_TOKEN is missing.");
  process.exit(1);
}
if (!appConfig.clientId) {
  log.error("CLIENT_ID is missing.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(appConfig.token);

try {
  if (appConfig.devGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(appConfig.clientId, appConfig.devGuildId),
      { body },
    );
    log.info(
      `Deployed ${body.length} guild commands to ${appConfig.devGuildId}.`,
    );
  } else {
    await rest.put(Routes.applicationCommands(appConfig.clientId), { body });
    log.info(`Deployed ${body.length} global commands.`);
  }
} catch (error) {
  log.error("Command deployment failed", error);
  process.exit(1);
}
