import "./env.js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const botRoot = fileURLToPath(new URL("..", import.meta.url));

function integer(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  devGuildId: process.env.DISCORD_GUILD_ID || "",
  dataDir: resolve(process.env.PLY_DATA_DIR || resolve(botRoot, "data")),
  logLevel: process.env.LOG_LEVEL || "info",
  restTimeoutMs: integer(process.env.REST_TIMEOUT_MS, 20000),
  restRetries: integer(process.env.REST_RETRIES, 2),
  presence: process.env.BOT_PRESENCE || "Just apply, but customized.",
  ownerIds: new Set(
    (process.env.BOT_OWNER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ),
};
